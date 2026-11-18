import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
export const revisions = { before: 'c25f134b4', after: '4687068d19fa8d5762f86577460a720690f72c82' }
const root = resolve(import.meta.dirname, '../..')
export function prepare() {
	const manifests = {}
	for (const [variant, ref] of Object.entries(revisions)) {
		const directory = resolve(import.meta.dirname, '.cache', variant)
		mkdirSync(directory, { recursive: true })
		const paths = [
			'packages/core/src',
			'packages/plugins/src',
			'packages/setup/index.ts',
			'packages/setup/protected',
			'packages/setup/content',
			'packages/icons/material/src',
			'packages/themes/base/setup',
			'packages/themes/oren/setup',
			...['vue', 'react', 'solid', 'svelte', 'angular', 'webc'].map(
				(fw) => `packages/ui/${fw}/src`,
			),
		]
		const sha = execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim()
		// Build input cache only: no checkout, Git metadata or extra worktree.
		const archive = execFileSync('git', ['archive', sha, ...paths], {
			cwd: root,
			maxBuffer: 40 * 1024 * 1024,
		})
		execFileSync('tar', ['-xf', '-', '-C', directory], { input: archive })
		manifests[variant] = {
			sha,
			files: execFileSync('git', ['ls-tree', '-r', '--name-only', sha, ...paths], {
				cwd: root,
				encoding: 'utf8',
			})
				.trim()
				.split('\n').length,
		}
	}
	writeFileSync(
		resolve(import.meta.dirname, '.cache/provenance.json'),
		JSON.stringify(
			{
				revisions: manifests,
				rootFrameworks: JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
					.devDependencies,
			},
			null,
			2,
		),
	)
}
if (process.argv.includes('--prepare')) prepare()
