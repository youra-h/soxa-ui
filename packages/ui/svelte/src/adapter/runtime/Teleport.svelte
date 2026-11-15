<script lang="ts">
	import { getAllContexts, mount, unmount, untrack } from 'svelte'
	// Keep the self-import distinct from the component name emitted by svelte-package.
	import TeleportContent from './Teleport.svelte'
	import type { TTeleportProps } from './types'

	const props: TTeleportProps = $props()

	/** Фаза только растёт: нет → на месте → в обёртке. */
	type TPhase = 'none' | 'placed' | 'wrapped'

	// Корень в обёртке получает контексты места: локаль и лифт — как у триггера
	const context = getAllContexts()

	// Первая отрисовка одна на сервере и в браузере
	let phase: TPhase = $state(untrack(() => props.disabled) ? 'placed' : 'none')

	/** Одна на всё монтирование, заводится в браузере, когда впервые нужна. */
	let wrapper: HTMLDivElement | null = null

	function wrapperNode(): HTMLDivElement {
		if (!wrapper) {
			wrapper = document.createElement('div')
			wrapper.style.display = 'contents'
		}

		return wrapper
	}

	function targetOf(selector: string | undefined): Element | null {
		return selector ? document.querySelector(selector) : null
	}

	/** Вынуть обёртку из `parent`, если она ещё там. */
	function takeFrom(parent: Element): void {
		if (wrapper && wrapper.parentNode === parent) wrapper.remove()
	}

	// До отрисовки: содержимое на месте уходит раньше, чем смонтируется корень
	$effect.pre(() => {
		if (phase === 'wrapped') return

		const { to, disabled } = props

		if (phase === 'placed' ? !disabled : disabled || targetOf(to) !== null) {
			phase = 'wrapped'
		}
	})

	// С `disabled` обёртку держит узел места; цели нет — она вне документа
	$effect(() => {
		if (phase !== 'wrapped' || props.disabled) return

		const target = targetOf(props.to)

		if (!target) return

		target.appendChild(wrapperNode())

		return () => takeFrom(target)
	})

	// Корень — в обёртку, один раз (заново — на смену `children`): тот же
	// Teleport, выключенный с первой отрисовки, рисует содержимое на месте
	$effect(() => {
		if (phase !== 'wrapped') return

		const content = mount(TeleportContent, {
			target: wrapperNode(),
			props: { to: undefined, disabled: true, children: props.children },
			context,
		})

		return () => {
			void unmount(content)
		}
	})

	/** Узел места: обёртку — в него, при снятии — вон. */
	function place(node: Element): () => void {
		node.appendChild(wrapperNode())

		return () => takeFrom(node)
	}
</script>

<!--
	Портал, как `<teleport :to>` у Vue: содержимое — отдельный корень (`mount`)
	в обёртке `display: contents`, а Teleport двигает саму обёртку — в цель, в
	узел места или вон из документа, — и набранное в панели остаётся.
	AGENTS.md (Svelte), «Teleport».
-->
{#if phase === 'placed'}
	{@render props.children?.()}
{:else if phase === 'wrapped' && props.disabled}
	<div style="display: contents" {@attach place}></div>
{/if}
