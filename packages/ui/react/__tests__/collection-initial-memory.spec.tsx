import { queryObjects } from 'node:v8'
import { createEngineTabs } from '@soxa-ui/core'
import { TCollectionAriaState } from '@soxa-ui/setup'
import { expect, it } from 'vitest'
import { TCollectionTransaction } from '../../../core/src/components/base/collection/engine/transactions/transaction.class'
import { Example, initial, selected } from './initial-collection.helpers'
import { mount } from './mount'

it('releases transaction receipts and ARIA state ports while a prepared collection stays mounted', () => {
	const engine = createEngineTabs({ items: initial.items })
	const mounted = mount(<Example engine={engine} />)

	expect(selected(mounted.container)).toEqual(['false', 'true'])
	expect(queryObjects(TCollectionTransaction, { format: 'count' })).toBe(0)
	expect(queryObjects(TCollectionAriaState, { format: 'count' })).toBe(0)

	expect(selected(mounted.container)).toEqual(['false', 'true'])
})
