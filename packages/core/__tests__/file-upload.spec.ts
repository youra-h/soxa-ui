import { describe, expect, it, vi } from 'vitest'
import { TFileUpload } from '@soxa-ui/core'

const file = (name: string, content: string, type = '') => new File([content], name, { type })

describe('FileUpload selection', () => {
	it('accepts files in order up to the shared limit and reports individual rejections', () => {
		const upload = new TFileUpload({
			accept: ' IMAGE/*, .TXT ',
			multiple: true,
			maxFiles: 2,
			maxFileSize: 3,
		})
		const reject = vi.fn()
		upload.events.on('reject', reject)

		const image = file('image.png', 'abc', 'image/png')
		const text = file('README.TXT', 'a')
		const wrongType = file('image.pdf', 'a', 'application/pdf')
		const tooLarge = file('big.txt', 'abcd')
		const tooMany = file('last.txt', '')

		upload.addFiles([image])
		const first = upload.items[0]
		upload.addFiles([wrongType, tooLarge, text, tooMany])

		expect(upload.files).toEqual([image, text])
		expect(upload.items[0]).toBe(first)
		expect(reject).toHaveBeenCalledExactlyOnceWith([
			{ file: wrongType, reason: 'type' },
			{ file: tooLarge, reason: 'size' },
			{ file: tooMany, reason: 'count' },
		])
		upload.removeFile(first.id)
		expect(upload.files).toEqual([text])
		expect(upload.rejections).toEqual([])
	})

	it('preserves a valid single file after rejection and replaces it on the next valid pick', () => {
		const upload = new TFileUpload({ accept: 'text/plain' })
		const original = file('one', '', 'text/plain')
		const replacement = file('two', '', 'text/plain')
		const changes = vi.fn()
		upload.events.on('change:files', changes)

		upload.addFiles([original])
		upload.addFiles([file('invalid', '', 'image/png')])
		expect(upload.files).toEqual([original])

		upload.addFiles([replacement])
		expect(changes).toHaveBeenLastCalledWith({ newValue: [replacement], oldValue: [original] })
		upload.disabled = true
		upload.removeFile(upload.items[0].id)
		upload.addFiles([original])
		expect(upload.files).toEqual([replacement])
		upload.resetFiles()
		expect(upload.files).toEqual([])
	})
})
