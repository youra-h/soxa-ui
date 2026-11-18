import { afterEach, describe, expect, it, vi } from 'vitest'
import { Suspense, use, type ReactElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { PassThrough } from 'node:stream'
import { createEngineTabs } from '@soxa-ui/core'
import {
	initial,
	Example,
	externalSnapshot,
	watchSubscriptions,
} from './initial-collection.helpers'
/** Use one native server renderer for completed and aborted requests in this module. */
function renderStream(element: ReactElement): Promise<string> {
	return new Promise((resolve, reject) => {
		const output = new PassThrough()
		const chunks: string[] = []
		output.on('data', (chunk) => chunks.push(String(chunk)))
		output.on('end', () => resolve(chunks.join('')))
		output.on('error', reject)
		const stream = renderToPipeableStream(element, {
			onAllReady: () => stream.pipe(output),
			onShellError: reject,
			onError: reject,
		})
	})
}

afterEach(() => vi.restoreAllMocks())
describe('initial collections in native server streams', () => {
	it('leaves an external engine unchanged when a completed server render is discarded', async () => {
		const engine = createEngineTabs({ items: initial.items })
		const before = externalSnapshot(engine)
		const live = watchSubscriptions(engine)
		const html = await renderStream(<Example engine={engine} />)
		expect(html).toContain('Panel B')
		expect(externalSnapshot(engine)).toEqual(before)
		await Promise.resolve()
		expect(live(), JSON.stringify(live.details())).toBe(0)
	})

	it('leaves external membership, metadata, attributes and subscriptions unchanged after abort', async () => {
		const engine = createEngineTabs({ items: initial.items })
		const live = watchSubscriptions(engine)
		const before = externalSnapshot(engine)
		const subscriptions = live()
		const pending = new Promise<void>(() => {})
		function Wait() {
			use(pending)
			return null
		}
		const output = new PassThrough()
		const chunks: string[] = []
		output.on('data', (chunk) => chunks.push(String(chunk)))
		const ended = new Promise<void>((resolve, reject) => {
			output.on('end', resolve)
			output.on('error', reject)
		})
		const errors: unknown[] = []
		const running: { stream?: ReturnType<typeof renderToPipeableStream> } = {}
		const shell = new Promise<void>((resolve, reject) => {
			running.stream = renderToPipeableStream(
				<Suspense fallback={<p>Waiting</p>}>
					<Example engine={engine} />
					<Wait />
				</Suspense>,
				{
					onShellReady: resolve,
					onShellError: reject,
					onError: (error) => {
						errors.push(error)
					},
				},
			)
		})
		await shell
		if (!running.stream) throw new Error('Expected server stream')
		running.stream.pipe(output)
		running.stream.abort()
		await ended
		expect(chunks.join('')).toContain('Waiting')
		expect(errors).toHaveLength(1)
		expect(externalSnapshot(engine)).toEqual(before)
		expect(live(), JSON.stringify(live.details())).toBe(subscriptions)
	})
})
