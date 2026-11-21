// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { createEngineSelect, TSelectSeparator } from '@soxa-ui/core'
import { TElementPlugin, TListSeparatorPlugin, TPluginBundle } from '../src'

const pending = new Map<number, FrameRequestCallback>()
let sequence = 0
const bundles: TPluginBundle[] = []

function frame(): void {
	const callbacks = [...pending.values()]

	pending.clear()
	for (const callback of callbacks) callback(0)
}

beforeEach(() => {
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		pending.set(++sequence, callback)
		return sequence
	})
	vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id))
})

afterEach(() => {
	for (const bundle of bundles.splice(0)) bundle.destroy()
	pending.clear()
	vi.unstubAllGlobals()
	document.body.innerHTML = ''
})

function scene(markup: string) {
	const root = document.createElement('div')
	const engine = createEngineSelect()

	root.innerHTML = markup
	document.body.append(root)

	const lines = [...root.querySelectorAll('hr')].map((node) => {
		const instance = new TSelectSeparator()
		const bundle = new TPluginBundle(instance).use(TElementPlugin).use(TListSeparatorPlugin)
		const element = bundle.get(TElementPlugin)
		const plugin = bundle.get(TListSeparatorPlugin)

		if (!element || !plugin) throw new Error('separator plugins missing')

		bundles.push(bundle)
		plugin.bindCollection(engine)
		element.element = node
		return { node, instance, bundle, element, plugin }
	})

	frame()
	frame()

	return { root, engine, lines }
}

const shown = (lines: { instance: TSelectSeparator }[]) =>
	lines.map(({ instance }) => instance.visible)

describe('manual line visibility', () => {
	it('hides edges and consecutive lines without depending on their own visibility', () => {
		const { lines } = scene('<hr><section>A</section><hr><hr><section>B</section><hr>')

		expect(shown(lines)).toEqual([false, true, false, false])
	})

	it('keeps one line across a hidden middle group and restores the other on reset', () => {
		const { root, engine, lines } = scene(
			'<section>A</section><hr><section hidden>B</section><hr><section>C</section>',
		)

		expect(shown(lines)).toEqual([true, false])

		root.querySelector('[hidden]')?.removeAttribute('hidden')
		engine.extensions.filter.query = 'new query'
		frame()

		expect(shown(lines)).toEqual([true, true])
	})

	it('ignores hidden ancestors but respects the own display of neighboring content', () => {
		const { root, engine, lines } = scene(
			'<section>A</section><hr><section style="display: none">B</section>',
		)

		root.hidden = true
		expect(shown(lines)).toEqual([false])

		root.lastElementChild?.removeAttribute('style')
		engine.extensions.filter.query = 'changed'
		frame()

		expect(shown(lines)).toEqual([true])
	})

	it('preserves a consumer visible value while structural visibility stays the same', () => {
		const { engine, lines } = scene('<section>A</section><hr><section>B</section>')
		const [line] = lines

		line.instance.visible = false
		engine.extensions.filter.query = 'changed'
		frame()

		expect(line.instance.visible).toBe(false)
	})

	it('cancels work on removal and destroy; a detached node schedules no frame', () => {
		const { engine, lines } = scene('<section>A</section><hr><section>B</section>')
		const [line] = lines

		engine.extensions.filter.query = 'changed'
		expect(pending.size).toBe(1)

		line.element.element = null
		expect(pending.size).toBe(0)

		engine.extensions.filter.query = 'again'
		expect(pending.size).toBe(0)

		line.bundle.destroy()
		engine.extensions.filter.clear()
		expect(pending.size).toBe(0)
	})

	it('subscribes without a node without scheduling browser work', () => {
		const bundle = new TPluginBundle(new TSelectSeparator())
			.use(TElementPlugin)
			.use(TListSeparatorPlugin)
		const plugin = bundle.get(TListSeparatorPlugin)
		const engine = createEngineSelect()

		bundles.push(bundle)
		plugin?.bindCollection(engine)
		engine.extensions.filter.query = 'query'

		expect(pending.size).toBe(0)
	})
})
