import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { defineBrowserCommand } from '@vitest/browser-playwright'
import { A11Y_ADAPTERS, A11Y_CASES, auditCasesFor } from '../../../shared/src/a11y.ts'

const RUN_ID = randomUUID()
const STARTED_AT = new Date().toISOString()
const manifests = new Map<string, Promise<void>>()

const GATE_CASES = ['gate/named', 'gate/unnamed', 'gate/incomplete']

/** Fixed destination and known inventory: the browser cannot choose a filesystem path. */
export const saveA11yReport = defineBrowserCommand<[report: Readonly<Record<string, unknown>>]>(
	async ({ page, project }, report) => {
		const adapter = report.adapter
		const auditCase = report.case

		if (typeof adapter !== 'string' || !A11Y_ADAPTERS.some((id) => id === adapter))
			throw new Error('Unknown audit adapter')
		if (
			typeof auditCase !== 'string' ||
			(!auditCasesFor(adapter).some((entry) => entry.id === auditCase) &&
				!GATE_CASES.includes(auditCase))
		)
			throw new Error('Unknown audit case')

		const browser = project.config.browser.name
		if (browser !== 'chromium' && browser !== 'webkit') throw new Error('Unknown audit browser')

		const directory = resolve(
			import.meta.dirname,
			'../..',
			'.vitest',
			'a11y',
			browser,
			adapter,
			RUN_ID,
		)
		const file = resolve(
			directory,
			auditCase.replace('/', '--') + (report.setupError ? '.setup.json' : '.json'),
		)

		const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
			cwd: import.meta.dirname,
			encoding: 'utf8',
		}).trim()
		const workingTree = execFileSync('git', ['status', '--porcelain'], {
			cwd: import.meta.dirname,
			encoding: 'utf8',
		}).trim()
			? 'modified'
			: 'clean'

		const output = {
			...report,
			runId: RUN_ID,
			browser,
			browserVersion: page.context().browser()?.version(),
			commit,
			workingTree,
			recordedAt: new Date().toISOString(),
		}

		await mkdir(directory, { recursive: true })

		let manifest = manifests.get(browser)
		if (!manifest) {
			manifest = writeFile(
				resolve(directory, '../..', 'run-' + RUN_ID + '.json'),
				JSON.stringify(
					{
						runId: RUN_ID,
						browser,
						startedAt: STARTED_AT,
						commit,
						workingTree,
						expectedAdapters: A11Y_ADAPTERS,
						expectedCases: A11Y_CASES.map((entry) => entry.id),
					},
					null,
					2,
				) + '\n',
				'utf8',
			)
			manifests.set(browser, manifest)
		}

		await manifest
		await writeFile(file, JSON.stringify(output, null, 2) + '\n', 'utf8')

		return readFile(file, 'utf8')
	},
)
