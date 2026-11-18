import { afterEach, expect, it, vi } from 'vitest'
import { Suspense, use } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { PassThrough } from 'node:stream'
import { Tabs } from '@soxa-ui/react'
import { createEngineTabs } from '@soxa-ui/core'
import { initial } from '../../packages/ui/react/__tests__/initial-collection.helpers'

afterEach(() => vi.useRealTimers())

it('completes native server streaming when a prepared child resumes after rollback', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
	let release!: () => void
	const pending = new Promise<void>((resolve) => {
		release = resolve
	})
	function LateItem() {
		use(pending)
		return <Tabs.Item initial={1} />
	}
	const engine = createEngineTabs({ items: initial.items })
	const output = new PassThrough()
	const chunks: string[] = []
	output.on('data', (chunk) => chunks.push(String(chunk)))
	const ended = new Promise<void>((resolve, reject) => {
		output.on('end', resolve)
		output.on('error', reject)
	})
	const errors: unknown[] = []
	let shell!: () => void
	const ready = new Promise<void>((resolve) => {
		shell = resolve
	})
	const stream = renderToPipeableStream(
		<Tabs
			initial={initial}
			engine={engine}
			content={
				<>
					<Tabs.Content initial={0}>Panel A</Tabs.Content>
					<Tabs.Content initial={1}>Panel B</Tabs.Content>
				</>
			}
		>
			<Tabs.Item initial={0} />
			<Suspense fallback={null}>
				<LateItem />
			</Suspense>
		</Tabs>,
		{
			onShellReady: shell,
			onAllReady: () => stream.pipe(output),
			onShellError: shell,
			onError: (error) => errors.push(error),
		},
	)
	try {
		await ready
		vi.advanceTimersByTime(1200)
		release()
		await ended
		expect(errors).toEqual([])
		const container = document.createElement('div')
		container.innerHTML = chunks.join('')
		expect(container.querySelectorAll('[role=tab]')).toHaveLength(2)
		expect(container.querySelectorAll('[role=tab][aria-selected=true]')).toHaveLength(1)
		expect(container.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel B')
		const selected = container.querySelector('[role=tab][aria-selected=true]')
		expect(selected?.getAttribute('aria-controls')).toBe(
			container.querySelector('[role=tabpanel]')?.id,
		)
	} finally {
		stream.abort()
	}
})
