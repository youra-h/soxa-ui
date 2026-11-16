import React from 'react'
import { renderToString, renderToPipeableStream } from 'react-dom/server'
import { Writable } from 'node:stream'
import { writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { Example, libraries, resource } from './components'
import { snapshot } from './snapshot'

const rows = []
let diagnostics = []
const warn = console.warn
const error = console.error
console.warn = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	warn(...args)
}
console.error = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	error(...args)
}
async function stream(tree, gate, abort) {
	let html = ''
	const errors = []
	await new Promise<void>((resolve, reject) => {
		const sink = new Writable({
			write(chunk, _encoding, callback) {
				html += String(chunk)
				callback()
			},
		})
		sink.on('finish', resolve)
		sink.on('error', reject)
		const run = renderToPipeableStream(tree, {
			onShellReady() {
				if (abort) {
					run.pipe(sink)
					setImmediate(() => run.abort(new Error('experiment abort')))
				} else setImmediate(() => gate.resolve())
			},
			onAllReady() {
				if (!abort) run.pipe(sink)
			},
			onShellError: reject,
			onError(failure) {
				errors.push(String(failure))
			},
		})
	})
	return { html, errors }
}
for (const library of Object.keys(libraries)) {
	for (const selected of ['a', 'b', undefined]) {
		const cases =
			selected === undefined
				? ['no-default']
				: ['sync', 'suspended', 'resolved-stream', 'aborted-stream', 'late-custom-id']
		for (const name of cases) {
			diagnostics = []
			try {
				const gate = resource(false)
				const scenario = ['sync', 'no-default', 'late-custom-id'].includes(name)
					? 'sync'
					: name === 'suspended'
						? 'suspended'
						: 'fallback-trigger'
				const tree = (
					<Example
						library={library}
						selected={name === 'no-default' ? null : selected}
						gate={gate}
						scenario={scenario}
						customId={name === 'late-custom-id'}
					/>
				)
				const result = name.endsWith('stream')
					? await stream(tree, gate, name === 'aborted-stream')
					: { html: renderToString(tree), errors: [] }
				const dom = new JSDOM(result.html)
				const state = snapshot(dom.window.document)
				dom.window.close()
				rows.push({
					library,
					name,
					selected,
					html: result.html,
					errors: result.errors,
					diagnostics: [...diagnostics],
					state,
				})
			} catch (failure) {
				rows.push({
					library,
					name,
					selected,
					error: String(failure),
					diagnostics: [...diagnostics],
				})
			}
		}
	}
}
console.warn = warn
console.error = error
writeFileSync('server-results.json', JSON.stringify(rows, null, 2))
console.log('SSR cases: ' + rows.length)
