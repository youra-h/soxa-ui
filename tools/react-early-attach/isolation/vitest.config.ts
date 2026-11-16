import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import base from '../vitest.config.ts'

export default defineConfig({
	resolve: base.resolve,
	plugins: [
		{
			name: 'request-owned-ssr-experiment',
			enforce: 'pre',
			transform(source, id) {
				if (!id.replaceAll('\\', '/').endsWith('/adapter/runtime/useAdapterContext.ts'))
					return
				const create =
					'return createAdapterContext(descriptor, { mountId: id, locale, ...options }, config)'
				const built = '\t\tdrafts.add(held, built.destroy, id)'
				if (!source.includes(create) || !source.includes(built))
					throw new Error('Runtime anchor changed')
				return source
					.replace(
						'private _destroyed = false',
						'private _destroyed = false\n isolationAttached = false',
					)
					.replace(
						create,
						`
          globalThis.__ssrIsolation?.checkInput(options)
          const context = createAdapterContext(descriptor, { mountId: id, locale, ...options }, config)
          globalThis.__ssrIsolation?.capture(context)
          return context
        `,
					)
					.replace(
						built,
						`${built}
          if (globalThis.__ssrIsolation?.early()) {
            attachAll(built.contexts)
            built.isolationAttached = true
          }
        `,
					)
					.replace(
						'accepting(this.contexts, () => attachAll(this.contexts))',
						'if (!this.isolationAttached) accepting(this.contexts, () => attachAll(this.contexts))',
					)
			},
		},
		react(),
	],
	test: { ...base.test, include: ['tools/react-early-attach/isolation/*.spec.tsx'] },
})
