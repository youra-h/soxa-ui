import { afterAll, afterEach, beforeEach, expect, it } from 'vitest'
import { Suspense } from 'react'
import { renderToString, renderToPipeableStream } from 'react-dom/server.node'
import { Writable } from 'node:stream'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Tabs } from '@soxa-ui/react'
import { createEngineTabs } from '@soxa-ui/core'
import { registrations } from './journal'

const rows: object[] = []
const wait = (ms = 80) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const turn = () => new Promise<void>((resolve) => setImmediate(resolve))
beforeEach(() => {
	registrations.reset()
	registrations.configure(30)
})
afterEach(() => registrations.reset())

it('rolls back speculative SSR items while an external parent engine stays alive', async () => {
	const external = createEngineTabs()
	function Never(): never {
		throw new Promise(() => {})
	}
	function SomeComponent() {
		return (
			<>
				<Tabs.Item value="b" text="B" active />
				<Never />
			</>
		)
	}
	const html = renderToString(
		<Tabs engine={external} content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
			<Tabs.Item value="a" text="A" />
			<Suspense fallback={<span>WAITING</span>}>
				<SomeComponent />
			</Suspense>
		</Tabs>,
	)
	const before = external.extensions.batch.items.map((item) => item.value)
	const refs = [...registrations.models, ...registrations.contexts, ...registrations.resources]
	await wait()
	const after = external.extensions.batch.items.map((item) => item.value)
	for (let pass = 0; pass < 8; pass++) {
		await turn()
		global.gc?.()
	}
	rows.push({
		name: 'ssr-retained-parent-gc',
		before,
		after,
		pending: registrations.size,
		counters: { ...registrations.counters },
		weakObservations: refs.length,
		alive: refs.filter((ref) => ref.deref()).length,
		html,
		note: 'External owner engine intentionally remains strongly reachable. Weak references target speculative item models, adapter/facade contexts and bundles; repeated observations are possible.',
	})
	expect(before).toEqual(['a', 'b'])
	expect(after).toEqual([])
	expect(registrations.size).toBe(0)
	expect(registrations.counters.rollback).toBe(2)
})

it('continues native streaming after provisional items expired before resource resolution', async () => {
	let ready = false
	let finish!: () => void
	const pending = new Promise<void>((resolve) => {
		finish = resolve
	})
	function Late() {
		if (!ready) throw pending
		return <Tabs.Item value="late" text="LATE" />
	}
	let html = ''
	const errors: string[] = []
	let rolledBackBeforeResume = 0
	await new Promise<void>((resolve, reject) => {
		const sink = new Writable({
			write(chunk, _encoding, callback) {
				html += String(chunk)
				callback()
			},
		})
		sink.on('finish', resolve)
		sink.on('error', reject)
		const stream = renderToPipeableStream(
			<Tabs>
				<Tabs.Item value="a" text="A" />
				<Suspense fallback={<span>WAITING</span>}>
					<Tabs.Item value="b" text="B" active />
					<Late />
				</Suspense>
			</Tabs>,
			{
				onShellReady() {
					setTimeout(() => {
						rolledBackBeforeResume = registrations.counters.rollback
						ready = true
						finish()
					}, 80)
				},
				onAllReady() {
					stream.pipe(sink)
				},
				onShellError: reject,
				onError: (error) => errors.push(String(error)),
			},
		)
	})
	await wait()
	rows.push({
		name: 'stream-after-expiration',
		html,
		errors,
		rolledBackBeforeResume,
		pending: registrations.size,
		counters: { ...registrations.counters },
	})
	expect(rolledBackBeforeResume).toBeGreaterThan(0)
	expect(errors).toHaveLength(0)
	expect(html).toContain('LATE')
	expect(registrations.size).toBe(0)
})

it('settles a larger independent item set without sibling identity collisions', async () => {
	const external = createEngineTabs()
	renderToString(
		<Tabs engine={external}>
			{Array.from({ length: 120 }, (_, index) => (
				<Tabs.Item key={index} value={index} />
			))}
		</Tabs>,
	)
	expect(external.extensions.batch.items).toHaveLength(120)
	await wait()
	rows.push({
		name: 'independent-item-batch',
		remaining: external.extensions.batch.items.length,
		pending: registrations.size,
		counters: { ...registrations.counters },
	})
	expect(external.extensions.batch.items).toHaveLength(0)
	expect(registrations.counters.rollback).toBe(120)
})

afterAll(() => {
	const dir = path.join(import.meta.dirname, 'results')
	mkdirSync(dir, { recursive: true })
	writeFileSync(path.join(dir, 'server.json'), JSON.stringify(rows, null, 2))
})
