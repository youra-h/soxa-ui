import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { A11Y_ADAPTERS, A11Y_CASES, auditCasesFor } from '../../../shared/src/a11y.ts'

const [browser, requestedRun] = process.argv.slice(2)
if (!['chromium', 'webkit'].includes(browser)) throw new Error('Expected chromium or webkit')

const root = resolve(import.meta.dirname, '../..', '.vitest/a11y', browser)
const load = (file) => JSON.parse(readFileSync(file, 'utf8'))

const manifests = readdirSync(root)
	.filter((name) => /^run-[a-f0-9-]{36}\.json$/.test(name))
	.map((name) => load(resolve(root, name)))
const manifest =
	requestedRun && requestedRun !== 'latest'
		? manifests.find((value) => value.runId === requestedRun)
		: manifests.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
if (!manifest || !/^[a-f0-9-]{36}$/.test(manifest.runId))
	throw new Error('No requested audit run manifest')

const same = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
if (
	manifest.browser !== browser ||
	!same(manifest.expectedAdapters, A11Y_ADAPTERS) ||
	!same(
		manifest.expectedCases,
		A11Y_CASES.map((value) => value.id),
	)
)
	throw new Error('Manifest does not match the current audit inventory')

const errors = []
const summary = {
	runId: manifest.runId,
	browser,
	startedAt: manifest.startedAt,
	expectedReports: A11Y_ADAPTERS.flatMap(auditCasesFor).length,
	reports: 0,
	coverageEntries: Object.fromEntries(
		['direct', 'consumer', 'semantic-reference'].map((kind) => [
			kind,
			[
				...new Map(A11Y_CASES.map((entry) => [entry.component, entry.coverage])).values(),
			].filter((value) => value === kind).length,
		]),
	),
	violations: {},
	incomplete: {},
	waivedNodes: 0,
	unresolvedNodes: 0,
	staleExceptions: 0,
	axeVersions: [],
	browserVersions: [],
	sources: [],
	contrast: 'not passed',
}

const versions = new Set()
const engines = new Set()
const sources = new Set()
const count = (target, results) => {
	for (const result of results) {
		const previous = target[result.id] ?? { cases: 0, nodes: 0, impact: result.impact }

		previous.cases++
		previous.nodes += result.nodes.length
		target[result.id] = previous
	}
}

for (const adapter of A11Y_ADAPTERS)
	for (const entry of auditCasesFor(adapter)) {
		const directory = resolve(root, adapter, manifest.runId)
		const stem = entry.id.replace('/', '--')
		const file = resolve(directory, stem + '.json')

		if (existsSync(resolve(directory, stem + '.setup.json')))
			errors.push(adapter + '/' + entry.id + ': setup/classification error report')
		if (!existsSync(file)) {
			errors.push(adapter + '/' + entry.id + ': missing original axe report')
			continue
		}

		const report = load(file)
		if (
			report.runId !== manifest.runId ||
			report.browser !== browser ||
			report.adapter !== adapter ||
			report.case !== entry.id ||
			report.component !== entry.component ||
			report.consumer !== entry.consumer ||
			report.coverage !== entry.coverage ||
			report.state !== entry.state
		)
			throw new Error('Report context does not match inventory: ' + file)
		if (
			![report.axe, report.browserVersion, report.commit, report.workingTree].every(
				(value) => typeof value === 'string' && value.trim(),
			)
		)
			throw new Error('Missing axe/browser/source metadata: ' + file)
		if (report.commit !== manifest.commit || report.workingTree !== manifest.workingTree)
			throw new Error('Report source differs from the run manifest: ' + file)

		summary.reports++
		versions.add(report.axe)
		engines.add(report.browserVersion)
		sources.add(report.commit + ' (' + report.workingTree + ')')

		if (!Array.isArray(report.violations) || !Array.isArray(report.incomplete))
			throw new Error('Missing original axe findings: ' + file)
		count(summary.violations, report.violations)
		count(summary.incomplete, report.incomplete)

		if (report.gateError || !report.gate) {
			errors.push(adapter + '/' + entry.id + ': missing/failed classification')
			continue
		}

		summary.waivedNodes += report.gate.waived.length
		summary.unresolvedNodes += report.gate.failures.length
		summary.staleExceptions += report.gate.stale.length
	}

summary.axeVersions = [...versions]
summary.browserVersions = [...engines]
summary.sources = [...sources]

if (versions.size !== 1 || engines.size !== 1 || sources.size !== 1)
	errors.push('Run mixed engine, axe or source versions')
if (summary.unresolvedNodes || summary.staleExceptions)
	errors.push('Unresolved serious/critical nodes or stale exceptions')
if (!summary.violations['color-contrast'] && !summary.incomplete['color-contrast'])
	summary.contrast = 'no contrast findings in these fixtures'

process.stdout.write(JSON.stringify({ ...summary, errors }, null, 2) + '\n')
if (errors.length) process.exitCode = 1
