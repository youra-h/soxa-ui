import { useEffect, useRef, useState } from 'react'
import { TButton } from '@soxa-ui/core'
import { Button } from '@soxa-ui/react'

export default function CtrlExample() {
	// One controller per mounted subtree; never share mutable form state across requests.
	const controller = useRef<TButton | null>(null)
	if (controller.current === null) controller.current = new TButton({ text: 'Controller action' })
	const ctrl = controller.current
	const [clicks, setClicks] = useState(0)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		const count = () => setClicks((value) => value + 1)
		ctrl.events.on('change:text', count)
		setMounted(true)
		return () => ctrl.events.off('change:text', count)
	}, [ctrl])

	return (
		<section aria-label="Controller example">
			<Button
				ctrl={ctrl}
				type="button"
				onActionClick={() => {
					ctrl.text =
						ctrl.text === 'Controller action'
							? 'Controller action again'
							: 'Controller action'
				}}
			/>
			<output>Controller clicks: {clicks}</output>
			{mounted && <span data-testid="mounted">Mounted</span>}
		</section>
	)
}
