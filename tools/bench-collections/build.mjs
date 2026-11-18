import { build } from 'vite'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
execFileSync(process.execPath, [resolve(import.meta.dirname, 'generate.mjs')], { stdio: 'inherit' })
const { config } = await import('./config.ts')
const frameworks = (
	process.argv.find((a) => a.startsWith('--fw='))?.split('=')[1] ??
	'vue,react,solid,svelte,angular,webc'
).split(',')
const variants = (
	process.argv.find((a) => a.startsWith('--variant='))?.split('=')[1] ?? 'before,after'
).split(',')
for (const variant of variants)
	for (const fw of frameworks)
		for (const server of process.argv.includes('--client-only')
			? [false]
			: fw === 'webc'
				? [false]
				: [false, true]) {
			process.stderr.write(`Building ${variant}/${fw}/${server ? 'ssr' : 'client'}\n`)
			await build(config(fw, variant, server))
		}
