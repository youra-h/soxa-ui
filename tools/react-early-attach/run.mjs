import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
for (const mode of ['baseline', 'early', 'engine', 'engine-part']) {
	const run = spawnSync(
		process.execPath,
		[
			path.join(root, 'node_modules/vitest/vitest.mjs'),
			'run',
			'--config',
			'tools/react-early-attach/vitest.config.ts',
		],
		{ cwd: root, stdio: 'inherit', env: { ...process.env, ATTACH_MODE: mode } },
	)
	if (run.error) throw run.error
	if (run.status !== 0) process.exit(run.status ?? 1)
}
await import('./summary.mjs')
