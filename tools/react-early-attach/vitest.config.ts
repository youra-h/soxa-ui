import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const mode = process.env.ATTACH_MODE ?? 'baseline'
if (!['baseline', 'early', 'engine', 'engine-part'].includes(mode)) throw new Error(mode)

export default defineConfig({
	plugins: [
		{
			name: 'experimental-early-attach',
			enforce: 'pre',
			transform(source, id) {
				if (!id.replaceAll('\\', '/').endsWith('/adapter/runtime/useAdapterContext.ts'))
					return
				const anchor = '\t\tdrafts.add(held, built.destroy, id)'
				if (!source.includes(anchor)) throw new Error('Runtime anchor changed')
				const instrumentation = `
        const experimentEngine = [...parent.entries()].find(([key]) => key.description === 'soxa:item-context')?.[1] ?? listOf(built.contexts)
          .map(context => Reflect.get(context.instance, 'engine')).find(Boolean)
        const experimentMode = process.env.ATTACH_MODE ?? 'baseline'
        if (experimentMode === 'engine' && experimentEngine) {
          held.push(...drafts.take({ options: { engine: experimentEngine } }).held)
        }
        if (experimentMode === 'engine-part' && experimentEngine) {
          let parts = experimentParts.get(experimentEngine)
          if (!parts) experimentParts.set(experimentEngine, parts = new Map())
          let key = parts.get(mountId)
          if (!key) parts.set(mountId, key = {})
          held.push(...drafts.take({ ctrl: key }).held)
        }
        drafts.add(held, built.destroy, id)
        if (experimentMode !== 'baseline') attachAll(built.contexts)
        globalThis.__attachProbe?.(built, experimentEngine, experimentMode)
        `
				return source
					.replace(
						'const drafts = new TDrafts()',
						'const drafts = new TDrafts()\nconst experimentParts = new WeakMap<object, Map<string, object>>()',
					)
					.replace(anchor, instrumentation)
					.replace(
						'accepting(this.contexts, () => attachAll(this.contexts))',
						"if ((process.env.ATTACH_MODE ?? 'baseline') === 'baseline') accepting(this.contexts, () => attachAll(this.contexts))",
					)
			},
		},
		react(),
	],
	resolve: {
		alias: {
			'@soxa-ui/core': path.join(root, 'packages/core/src'),
			'@soxa-ui/setup': path.join(root, 'packages/setup/index.ts'),
			'@soxa-ui/plugins': path.join(root, 'packages/plugins/src'),
			'@soxa-ui/react': path.join(root, 'packages/ui/react/src/index.ts'),
			'@soxa-ui/icons-material': path.join(root, 'packages/icons/material/src'),
		},
	},
	test: {
		environment: 'node',
		include: ['tools/react-early-attach/*.spec.tsx'],
		pool: 'forks',
		maxWorkers: 1,
		execArgv: ['--expose-gc'],
		testTimeout: 30000,
	},
})
