import { createSignal, onCleanup, onMount } from 'solid-js'
import { TButton } from '@soxa-ui/core'
import { Button } from '@soxa-ui/solid'

export default function CtrlExample() {
	// Each request/remount owns its controller.
	const ctrl = new TButton({ text: 'Controller action' })
	const [clicks, setClicks] = createSignal(0)
	const [mounted, setMounted] = createSignal(false)
	let root: Element | undefined

	onMount(() => {
		const count = () => setClicks((value) => value + 1)
		ctrl.events.on('change:text', count)
		onCleanup(() => ctrl.events.off('change:text', count))
		setMounted(true)
	})

	return (
		<section aria-label="Controller example">
			<Button
				ctrl={ctrl}
				type="button"
				ref={(element) => {
					root = element
				}}
				onActionClick={() => {
					ctrl.text =
						ctrl.text === 'Controller action'
							? 'Controller action again'
							: 'Controller action'
				}}
			/>
			<button
				type="button"
				onClick={() => {
					if (root instanceof HTMLElement) root.focus()
				}}
			>
				Focus controller
			</button>
			<output>Controller clicks: {clicks()}</output>
			{mounted() && <span data-testid="mounted">Mounted</span>}
		</section>
	)
}
