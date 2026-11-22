import { execFileSync, spawnSync } from 'node:child_process'
import { loadRelease, prepareRelease } from './plan.mjs'
import { upgradeGuideFor, requireUpgradeGuide } from '../release-compatibility/upgrade.mjs'

const [command, scope, ...extra] = process.argv.slice(2)
try {
	if (
		!['plan', 'prepare'].includes(command) ||
		(extra.length && (extra.length !== 1 || extra[0] !== '--beta'))
	)
		throw new Error(
			'Usage: release:plan|release:prepare -- components|themes|icons|mcp|all [--beta]',
		)
	const root = process.cwd()
	if (
		command === 'prepare' &&
		execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim()
	)
		throw new Error('Prepare a release from a clean worktree')
	const release = await loadRelease(root, scope, { beta: extra[0] === '--beta' })
	if (release.manifest.packages.length)
		release.manifest.upgradeGuide = upgradeGuideFor(release.manifest)
	console.log(JSON.stringify(release.manifest, null, 2))
	if (command === 'prepare') {
		requireUpgradeGuide(root, release.manifest)
		execFileSync(process.execPath, ['tools/release-compatibility/cli.mjs', 'check'], {
			cwd: root,
			stdio: 'inherit',
		})
		await prepareRelease(root, release)
		const args = [
			'install',
			'--package-lock-only',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
		]
		const npm = process.env.npm_execpath
		const result = npm
			? spawnSync(process.execPath, [npm, ...args], { cwd: root, stdio: 'inherit' })
			: spawnSync('npm ' + args.join(' '), { cwd: root, stdio: 'inherit', shell: true })
		if (result.error || result.status !== 0)
			throw new Error('Updating the release lockfile failed')
	}
} catch (error) {
	console.error(error.message)
	process.exitCode = 1
}
