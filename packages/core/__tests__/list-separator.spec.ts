import { describe, it, expect } from 'vitest'
import { TSelectSeparator, TListBoxSeparator, TListSeparator } from '@soxa-ui/core'

describe('manual list separators', () => {
	it.each([
		[TSelectSeparator, 'so-select__separator'],
		[TListBoxSeparator, 'so-list-box__separator'],
	] as const)('silent native line with the existing theme class', (Separator, block) => {
		const separator = new Separator()

		expect(separator).toBeInstanceOf(TListSeparator)
		expect(separator.classes.toArray()).toContain(block)
		expect(separator.aria.get('aria-hidden')).toBe('true')
		expect(separator.aria.get('role')).toBeUndefined()
	})
})
