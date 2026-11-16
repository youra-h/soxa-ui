import { afterAll, expect, it } from 'vitest'
import { Suspense } from 'react'
import { renderToString, renderToPipeableStream } from 'react-dom/server.node'
import { Writable } from 'node:stream'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { Tabs } from '@soxa-ui/react'
import { TTabs } from '@soxa-ui/core'
import { TIsolatedExecution, installIsolationHooks, removeIsolationHooks } from './scope.mjs'

installIsolationHooks()
const rows: object[] = []
function Tree({ prefix = '' }: { prefix?: string }) {
	return (
		<Tabs content={<Tabs.Content value="b">{prefix + 'PANEL-b'}</Tabs.Content>}>
			<Tabs.Item value="a" />
			<Tabs.Item value="b" active />
		</Tabs>
	)
}
function SomeComponent({ gate }: { gate: { read(): void } }) {
	function Wait() {
		gate.read()
		return null
	}
	return (
		<>
			<Tabs.Item value="b" active />
			<Wait />
		</>
	)
}
const immediate = () => new Promise<void>((resolve) => setImmediate(resolve))

it('isolates synchronous assemblies and disposes them after HTML serialization', async () => {
	const scope = new TIsolatedExecution()
	let html = ''
	let before: unknown
	try {
		html = scope.run(() => renderToString(<Tree />))
		before = scope.values()
	} finally {
		scope.dispose()
	}
	const references = scope.references
	for (let pass = 0; pass < 8; pass++) {
		await immediate()
		global.gc?.()
	}
	rows.push({
		name: 'sync',
		html,
		before,
		tabStops: (html.match(/<button[^>]*role="tab"[^>]*tabindex="0"/g) ?? []).length,
		destroyed: scope.destroyed,
		retainedContexts: scope.contexts.length,
		weakObservations: references.length,
		alive: references.filter((ref) => ref.deref()).length,
	})
	expect(html).toContain('PANEL-b')
	expect(scope.destroyed).toBeGreaterThan(0)
	expect(scope.contexts).toHaveLength(0)
})

it('preserves evidence that request disposal does not correct a suspended branch HTML', () => {
	const scope = new TIsolatedExecution()
	let html = ''
	let before: unknown
	try {
		html = scope.run(() =>
			renderToString(
				<Tabs content={<Tabs.Content value="b">GHOST-PANEL-b</Tabs.Content>}>
					<Tabs.Item value="a" />
					<Suspense fallback={<span>FALLBACK</span>}>
						<SomeComponent
							gate={{
								read() {
									throw new Promise(() => {})
								},
							}}
						/>
					</Suspense>
				</Tabs>,
			),
		)
		before = scope.values()
	} finally {
		scope.dispose()
	}
	rows.push({ name: 'suspended-user-wrapper', html, before, destroyed: scope.destroyed })
	expect(html).toContain('FALLBACK')
	expect(html).toContain('GHOST-PANEL-b')
})

async function streamed(prefix: string, abort = false) {
	const scope = new TIsolatedExecution()
	let ready = false
	let resolve!: () => void
	const promise = new Promise<void>((done) => {
		resolve = done
	})
	const gate = {
		read() {
			if (!ready) throw promise
		},
	}
	let html = ''
	const errors: string[] = []
	let before: unknown
	try {
		await scope.run(
			() =>
				new Promise<void>((done, reject) => {
					const sink = new Writable({
						write(chunk, _encoding, callback) {
							html += String(chunk)
							callback()
						},
					})
					sink.on('finish', done)
					sink.on('error', reject)
					const stream = renderToPipeableStream(
						<Tabs content={<Tabs.Content value="b">{prefix + 'PANEL-b'}</Tabs.Content>}>
							<Tabs.Item value="a" />
							<Suspense fallback={<Tabs.Item value="fallback" text="FALLBACK" />}>
								<SomeComponent gate={gate} />
							</Suspense>
						</Tabs>,
						{
							onShellReady() {
								if (abort) {
									stream.pipe(sink)
									setImmediate(() => stream.abort(new Error('isolation abort')))
								} else
									setImmediate(() => {
										ready = true
										resolve()
									})
							},
							onAllReady() {
								if (!abort) stream.pipe(sink)
							},
							onShellError: reject,
							onError(error) {
								errors.push(String(error))
							},
						},
					)
				}),
		)
		before = scope.values()
	} finally {
		scope.dispose()
	}
	return {
		name: abort ? 'stream-abort' : 'stream-resolved',
		prefix,
		html,
		errors,
		before,
		destroyed: scope.destroyed,
		retainedContexts: scope.contexts.length,
		references: scope.references,
	}
}

it('disposes resolved and aborted streams and keeps concurrent requests separate', async () => {
	const outputs = await Promise.all([
		streamed('LEFT-'),
		streamed('RIGHT-'),
		streamed('ABORT-', true),
	])
	for (let pass = 0; pass < 8; pass++) {
		await immediate()
		global.gc?.()
	}
	for (const output of outputs) {
		const { references, ...row } = output
		rows.push({
			...row,
			weakObservations: references.length,
			alive: references.filter((ref) => ref.deref()).length,
		})
		expect(output.destroyed).toBeGreaterThan(0)
		expect(output.retainedContexts).toBe(0)
		expect(output.html).toContain(output.prefix + 'PANEL-b')
	}
	expect(outputs[0].html).not.toContain('RIGHT-PANEL')
	expect(outputs[1].html).not.toContain('LEFT-PANEL')
})

it('runs disposal on rendering errors and refuses external ctrl before modifying it', () => {
	const scope = new TIsolatedExecution()
	function Fail(): never {
		throw new Error('application error')
	}
	expect(() =>
		scope.run(() => {
			try {
				return renderToString(
					<Tabs>
						<Tabs.Item value="a" />
						<Fail />
					</Tabs>,
				)
			} finally {
				scope.dispose()
			}
		}),
	).toThrow('application error')
	rows.push({
		name: 'application-error',
		destroyed: scope.destroyed,
		retainedContexts: scope.contexts.length,
	})
	expect(scope.contexts).toHaveLength(0)
	const external = new TTabs()
	const aria = external.aria.valueOf()
	const guard = new TIsolatedExecution()
	expect(() =>
		guard.run(() => {
			try {
				return renderToString(<Tabs ctrl={external} />)
			} finally {
				guard.dispose()
			}
		}),
	).toThrow('Prototype only')
	expect(external.aria.valueOf()).toEqual(aria)
	rows.push({ name: 'external-ctrl-refused', destroyed: guard.destroyed, unchanged: true })
})

afterAll(() => {
	removeIsolationHooks()
	const directory = path.join(import.meta.dirname, 'results')
	mkdirSync(directory, { recursive: true })
	writeFileSync(
		path.join(directory, 'server.json'),
		JSON.stringify({ node: process.version, rows }, null, 2),
	)
})
