import { describe, expect, it } from 'vitest'
import { TWindowStrategy } from '@soxa-ui/core'
import { createEngineTree } from '../src/components/custom/tree/collection/factory'
import type { ITreeNode } from '../src/components/custom/tree/types'

const account: ITreeNode = {
	value: 'accounts',
	text: 'Accounts',
	children: [
		{
			value: 'acme',
			text: 'Acme',
			children: [{ value: 'details', text: 'Details' }],
		},
		{ value: 'globex', text: 'Globex' },
	],
}
const support: ITreeNode = { value: 'support', text: 'Support', hasChildren: true }
const nodes = [account, support]
const values = (items: readonly { value: string | number }[]) => items.map((item) => item.value)

describe('Tree collection', () => {
	it('keeps a single traversal for queries and drawing', () => {
		const { batch, tree, draw } = createEngineTree(nodes).extensions

		expect(values(batch.items)).toEqual(['accounts', 'acme', 'details', 'globex', 'support'])
		expect(values(batch.shown)).toEqual(['accounts', 'support'])
		tree.expanded = ['accounts', 'acme']

		expect(values(batch.shown)).toEqual(['accounts', 'acme', 'details', 'globex', 'support'])
		expect(draw.drawn.map((entry) => entry.kind === 'item' && entry.item.value)).toEqual(
			values(batch.shown),
		)
		expect(tree.childrenOf(batch.items[0])).toEqual([batch.items[1], batch.items[3]])
		expect(tree.parentOf(batch.items[2])).toBe(batch.items[1])
	})

	it('preserves selection and identity on collapse, reorder and reparenting', () => {
		const { batch, selection, tree } = createEngineTree(nodes).extensions
		const [accounts, acme, details, globex] = batch.items

		selection.mode = 'multiple'
		selection.selectMany([acme, details])
		tree.expanded = ['accounts', 'acme']
		tree.toggle(accounts)

		expect(values(batch.shown)).toEqual(['accounts', 'support'])
		expect(selection.selected).toEqual([acme, details])
		tree.toggle(accounts)
		expect(batch.shown[2]).toBe(details)

		tree.setNodes([
			{
				...support,
				children: [
					{
						value: 'acme',
						text: 'Acme',
						children: [{ value: 'details', text: 'Details' }],
					},
				],
			},
			{ ...account, children: [{ value: 'globex', text: 'Globex' }] },
		])
		tree.expanded = ['support', 'accounts', 'acme']

		expect(batch.shown.slice(1)).toEqual([acme, details, accounts, globex])
		expect(selection.selected).toEqual([acme, details])

		tree.setNodes([{ ...account, children: [] }])
		expect(selection.selected).toEqual([])
	})

	it('checks the whole input before reconciling it', () => {
		const { batch, tree } = createEngineTree(nodes).extensions
		const previous = batch.items

		expect(() => tree.setNodes([account, { value: 'details', text: 'Duplicate' }])).toThrow(
			'Duplicate Tree node value: details',
		)
		expect(batch.items).toEqual(previous)
	})

	it('reconciles children only under their accepted parent', () => {
		const { batch, tree } = createEngineTree(nodes).extensions
		const target = batch.items[4]

		expect(tree.isBranch(target)).toBe(true)
		expect(() => tree.setChildren(target, [{ value: 'acme', text: 'Duplicate' }])).toThrow(
			'Duplicate Tree node value: acme',
		)
		expect(tree.childrenOf(target)).toEqual([])
		expect(tree.setChildren(target, [{ value: 'faq', text: 'FAQ' }])).toBe(true)
		expect(values(batch.shown)).toEqual(['accounts', 'support'])

		tree.toggle(target)
		expect(values(batch.shown)).toEqual(['accounts', 'support', 'faq'])
		expect(tree.setChildren(target, [])).toBe(true)
		expect(tree.isBranch(target)).toBe(false)

		tree.setNodes([account])
		tree.setNodes(nodes)
		expect(tree.setChildren(target, [{ value: 'late', text: 'Late result' }])).toBe(false)
		expect(values(batch.items)).not.toContain('late')
	})

	it('discards a result after replacing the snapshot even if the key survives', async () => {
		const { batch, tree } = createEngineTree(nodes).extensions
		const parent = batch.items[4]
		let complete: (value: readonly ITreeNode[]) => void = () => {}
		let signal: AbortSignal | undefined

		const pending = tree.loadChildren(parent, (request) => {
			signal = request.signal
			return new Promise((resolve) => {
				complete = resolve
			})
		})
		expect(tree.isLoading(parent)).toBe(true)

		tree.setNodes([account, { ...support, text: 'New support' }])
		complete([{ value: 'late', text: 'Late result' }])
		await pending

		expect(signal?.aborted).toBe(true)
		expect(batch.items.at(-1)).toBe(parent)
		expect(tree.childrenOf(parent)).toEqual([])
		expect(tree.isLoading(parent)).toBe(false)
	})

	it('uses indices among siblings even when rows are windowed', () => {
		const { batch, tree, draw } = createEngineTree(nodes).extensions
		tree.expanded = ['accounts', 'acme']
		const [accounts, acme, details, globex, support] = batch.shown

		draw.useStrategy(new TWindowStrategy())
		draw.notifyViewport({ top: 0, bottom: 20, step: 20 })
		expect(accounts.aria.get('aria-setsize')).toBe('2')
		expect(acme.aria.get('aria-level')).toBe('2')
		expect(globex.aria.get('aria-posinset')).toBe('2')
		expect(details.aria.get('aria-setsize')).toBe('1')
		expect(support.aria.get('aria-expanded')).toBe('false')
	})

	it('allows Virtual to window only visible nodes', () => {
		const children = Array.from({ length: 100 }, (_, index) => ({
			value: index,
			text: `Document ${index}`,
		}))
		const { batch, tree, draw } = createEngineTree([{ ...support, children }]).extensions

		tree.expanded = ['support']
		const last = batch.shown[100]

		draw.useStrategy(new TWindowStrategy())
		draw.notifyViewport({ top: 0, bottom: 100, step: 20 })
		draw.pin('focus', last)

		expect(batch.shown).toHaveLength(101)
		expect(draw.drawn.length).toBeLessThan(30)
		expect(draw.drawn.some((entry) => entry.kind === 'item' && entry.item === last)).toBe(true)

		tree.expanded = []
		expect(values(batch.shown)).toEqual(['support'])
		expect(
			draw.drawn.flatMap((entry) => (entry.kind === 'item' ? [entry.item.value] : [])),
		).toEqual(['support'])
	})
})
