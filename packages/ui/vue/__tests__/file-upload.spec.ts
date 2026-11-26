import { expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { TFileUpload } from '@soxa-ui/core'
import { FileUpload } from '@soxa-ui/vue'

it('wires the real file input, chooser and native form attributes', async () => {
	const wrapper = mount(FileUpload, {
		props: {
			name: 'attachments',
			form: 'message',
			accept: 'image/*',
			multiple: true,
			required: true,
		},
	})
	try {
		await nextTick()
		const input = wrapper.get('input').element
		const open = vi.spyOn(input, 'click').mockImplementation(() => {})
		const choose = wrapper.get('button')
		await choose.trigger('click')
		expect(open).toHaveBeenCalledTimes(1)
		expect(input.type).toBe('file')
		expect(input.name).toBe('attachments')
		expect(input.accept).toBe('image/*')
		expect(input.multiple).toBe(true)
		expect(input.required).toBe(true)
		expect(input.getAttribute('form')).toBe('message')
		await wrapper.setProps({ disabled: true })
		expect(input.disabled).toBe(true)
		expect(choose.attributes('disabled')).toBeDefined()
	} finally {
		wrapper.unmount()
	}
})

it('renders file cards and the scoped progress slot on the server', async () => {
	const upload = new TFileUpload()
	const file = new File(['file'], 'example.txt', { type: 'text/plain' })
	upload.addFiles([file])
	const makeProgress = vi.fn(() => h('progress', { value: 40, max: 100 }))
	const html = await renderToString(
		h(FileUpload, { ctrl: upload }, { 'item-progress': makeProgress }),
	)

	expect(html).toContain('example.txt')
	expect(html).toContain('aria-label="Remove example.txt"')
	expect(html).toContain('<progress value="40" max="100">')
	expect(makeProgress).toHaveBeenCalledWith({ file, id: upload.items[0].id })
})
