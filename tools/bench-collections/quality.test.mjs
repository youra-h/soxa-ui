import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { quality } from './quality.mjs'
const html = `<div role="tablist"><button role="tab" id="a" aria-selected="false" tabindex="-1">Item 0</button><button role="tab" id="b" aria-selected="true" aria-controls="p" tabindex="0">Item 1</button></div><div role="tabpanel" id="p" aria-labelledby="b" tabindex="0">Panel 1</div>`
function checked(markup, kind = 'tabs', library = 'soxa') {
	const dom = new JSDOM(markup)
	const result = quality(dom.window.document, 2, kind, library)
	dom.window.close()
	return result
}
test('does not count a focusable panel as an extra tab-list stop', () =>
	assert.equal(checked(html).valid, true))
test('detects a second explicit tab stop in the collection', () =>
	assert.equal(checked(html.replace('tabindex="-1"', 'tabindex="0"')).checks.oneTabStop, false))
test('detects late or incorrect reciprocal panel ids', () =>
	assert.equal(checked(html.replace('aria-controls="p"', 'aria-controls="late"')).valid, false))
test('detects a missing item rather than calling less work faster', () =>
	assert.equal(checked(html.replace(/<button role="tab" id="a".*?<\/button>/, '')).valid, false))
test('accepts single-selection radio semantics in a composed toggle group', () =>
	assert.equal(
		checked(
			'<button data-bench-option role="radio" aria-checked="false">Item 0</button><button data-bench-option role="radio" aria-checked="true" tabindex="0">Item 1</button>',
			'tags',
			'shadcn',
		).valid,
		true,
	))
test('records a native focus pattern without declaring it a failed server render', () => {
	const result = checked(html.replace('tabindex="0"', 'tabindex="-1"'), 'tabs', 'shadcn')
	assert.equal(result.valid, true)
	assert.equal(result.checks.oneTabStop, false)
})
