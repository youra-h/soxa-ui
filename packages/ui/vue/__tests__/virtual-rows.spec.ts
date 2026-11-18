/**
 * Строка элемента живёт столько же, сколько её разметка, а не столько, сколько
 * элемент в коллекции: экземпляр `TItemRow` создаёт монтирование `ItemRow` и
 * отпускает его снятие. Окно `Virtual` ради этого и есть — большой список при
 * памяти на то, что показано, — и элемент, однажды показанный окном, строки за
 * собой не держит.
 *
 * `queryObjects` из `node:v8` сам собирает мусор и считает достижимые
 * экземпляры класса (см. React, `first-render-props.spec`). Файл свой и без
 * `@vue/test-utils`: подключённая обёртка записывает каждое событие каждого
 * компонента вместе с аргументами (`emitted()`) — и у приложений из
 * `createApp` тоже, — и узел из `element:ready` держал бы снятые окном
 * элементы до конца файла. Приложение собирается и снимается во вложенной
 * функции: последнее дерево держат её переменные, и после возврата его не
 * держит никто. Замер окна подаётся ядру руками, как в `virtual.spec.ts`.
 */

import { describe, it, expect } from 'vitest'
import { createApp, h, nextTick, type VNode } from 'vue'
import { queryObjects } from 'node:v8'
import { TItemRow, createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import type { TDrawViewport } from '@soxa-ui/core'
import { ListBox, Select, Virtual } from '@soxa-ui/vue'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

async function settle(): Promise<void> {
	await nextTick()
	await nextFrame()
}

const rows = () => queryObjects(TItemRow, { format: 'count' })

/** Видно 10 мест по 30px, с запасом окна — до 30 строк. */
const WINDOW = 30
const COUNT = 1000

function items(count: number) {
	return Array.from({ length: count }, (_, index) => ({
		value: `v${index + 1}`,
		text: `Пункт ${index + 1}`,
	}))
}

type TWindowed = {
	readonly extensions: { readonly draw: { notifyViewport(viewport: TDrawViewport): void } }
}

/**
 * Собрать в окне, пролистать по экрану за шаг от первого места до последнего
 * и снять. Возвращает, сколько строк было живо у конца списка.
 */
async function scrollThrough(engine: TWindowed, content: () => VNode): Promise<number> {
	const host = document.body.appendChild(document.createElement('div'))
	const app = createApp({ render: content })

	app.mount(host)
	await settle()

	for (let top = 0; top < COUNT * 30; top += 300) {
		engine.extensions.draw.notifyViewport({ top, bottom: top + 300, step: 30 })
		await settle()
	}

	const alive = rows()

	app.unmount()
	host.remove()
	// The selector engine of jsdom keeps the node of its last query
	// (`closest`, `querySelector`), and through its `__vnode` the whole unmounted
	// tree: the plugins of a Select query its nodes and its panel's. A query on
	// the document lets it go — a browser keeps no such node
	document.querySelector('body')

	// jsdom's MutationObserver disconnect dereferences its WeakRefs. V8 keeps
	// those nodes alive until the current job ends, even after disconnection.
	// Collect in the next task; actual retained rows must still be exactly zero.
	await new Promise<void>((resolve) => setTimeout(resolve))

	return alive
}

describe('строки — только у нарисованных', () => {
	it('ListBox: пролистанный до конца — строк не больше окна, снятый — ни одной', async () => {
		const engine = createEngineListBox({ items: items(COUNT) })
		const alive = await scrollThrough(engine, () => h(Virtual, () => h(ListBox, { engine })))

		expect(alive).toBeGreaterThan(0)
		expect(alive).toBeLessThanOrEqual(WINDOW)
		expect(rows()).toBe(0)
	}, 60000)

	it('Select: пролистанный до конца — строк не больше окна, снятый — ни одной', async () => {
		const engine = createEngineSelect({ items: items(COUNT) })
		// Options from data are drawn from the panel's first opening on
		const alive = await scrollThrough(engine, () =>
			h(Virtual, () => h(Select, { engine, open: true })),
		)

		expect(alive).toBeGreaterThan(0)
		expect(alive).toBeLessThanOrEqual(WINDOW)
		expect(rows()).toBe(0)
	}, 60000)
})
