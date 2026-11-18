import { mergeConfig } from 'vitest/config'
import { resolve } from 'node:path'
import base from '../../packages/ui/react/vitest.config.ts'
import { rollbackProbe } from './rollback-probe.mjs'

export default mergeConfig(base, {
	root: resolve(import.meta.dirname, '../../packages/ui/react'),
	plugins: [rollbackProbe()],
	test: {
		maxWorkers: 2,
		include: ['__tests__/**/*.spec.tsx', '../../../tools/ssr-acceptance/rollback*.spec.tsx'],
	},
})
