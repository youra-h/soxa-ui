import { describe, it, expect, vi } from 'vitest'
import { TComponent } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext } from '@soxa-ui/plugins'
import { createAdapterContext, defineComponent, definePlugin } from '@soxa-ui/setup'

const installs = vi.fn()
class TProbe extends TBasePlugin {
	value = ''
	options: object | undefined
	override install(ctx: IPluginContext, options: { value?: string; other?: number } = {}) {
		super.install(ctx, options)
		this.options = options
		installs({ ...options }, this.value)
	}
}
class TForeign extends TBasePlugin {}
const probe = definePlugin({ ctor: TProbe, contribution: { props: { value: { type: String } } } })
const foreign = definePlugin({ ctor: TForeign })
const descriptor = defineComponent({
	ctor: TComponent,
	plugins: [probe.with({ value: 'static', other: 7 })],
})

describe('per-mount plugin installation options', () => {
	it('supplies typed overrides before install and props seed without changing shared definitions', () => {
		installs.mockClear()
		const first = createAdapterContext(descriptor, {
			props: { value: 'seed' },
			pluginOptions: [probe.with({ value: 'mount' })],
		})
		const second = createAdapterContext(descriptor, {})
		expect(installs.mock.calls).toEqual([
			[{ value: 'mount', other: 7 }, ''],
			[{ value: 'static', other: 7 }, ''],
		])
		expect(first.bundle?.get(TProbe)?.value).toBe('seed')
		expect(descriptor.plugins[0].options).toEqual({ value: 'static', other: 7 })
		first.destroy()
		second.destroy()
	})
	it.each([{ entries: [foreign] }, { entries: [probe, probe] }])(
		'rejects unknown and duplicate entries before any install',
		({ entries }) => {
			installs.mockClear()
			expect(() => createAdapterContext(descriptor, { pluginOptions: entries })).toThrow(
				'declared plugin',
			)
			expect(installs).not.toHaveBeenCalled()
		},
	)
	it('keeps nested and reentrant mounting independent', () => {
		const nested: object[] = []
		class TReentrant extends TBasePlugin {
			override install(ctx: IPluginContext) {
				super.install(ctx)
				const inner = createAdapterContext(descriptor, {
					pluginOptions: [probe.with({ value: 'inner' })],
				})
				const installed = inner.bundle?.get(TProbe)?.options
				if (!installed) throw new Error('Nested probe was not installed')
				nested.push(installed)
				inner.destroy()
			}
		}
		const outer = defineComponent({
			ctor: TComponent,
			plugins: [definePlugin({ ctor: TReentrant }), probe],
		})
		const mounted = createAdapterContext(outer, {
			pluginOptions: [probe.with({ value: 'outer' })],
		})
		expect(nested).toEqual([{ value: 'inner', other: 7 }])
		expect(mounted.bundle?.get(TProbe)?.options).toEqual({ value: 'outer' })
		mounted.destroy()
	})
})
