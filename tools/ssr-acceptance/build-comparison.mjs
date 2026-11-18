import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

// Both outputs share the current core/setup/plugins and identical bundling options.
// The control differs only in the React runtime before transaction integration.
const before = execFileSync(
	'git',
	['show', '3d2a372e0:packages/ui/react/src/adapter/runtime/useAdapterContext.ts'],
	{ encoding: 'utf8' },
)
for (const mode of ['before', 'integrated']) {
	await build({
		configFile: false,
		root: resolve(import.meta.dirname, '../..'),
		plugins: [
			{
				name: 'runtime-comparison-control',
				enforce: 'pre',
				load(id) {
					if (
						mode === 'before' &&
						id.replaceAll('\\', '/').endsWith('/adapter/runtime/useAdapterContext.ts')
					)
						return before
				},
			},
			react(),
		],
		build: {
			outDir: resolve(import.meta.dirname, `results/comparison-${mode}`),
			emptyOutDir: true,
			minify: false,
			lib: {
				entry: resolve(import.meta.dirname, '../../packages/ui/react/src/index.ts'),
				formats: ['es'],
				fileName: 'index',
			},
			rollupOptions: { external: (id) => /^(react(?:-dom)?(?:\/|$)|@soxa-ui\/)/.test(id) },
		},
	})
}
