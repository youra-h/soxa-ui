import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

// Reuse the driver transaction implementation verbatim, without changing product sources.
const commit = '8ed2df2ac21544d20e69df7055994057378c64a3'
const directory = resolve(import.meta.dirname, 'results/rollback-source')
mkdirSync(directory, { recursive: true })
for (const name of ['types.ts', 'transaction.class.ts', 'transactions.class.ts']) {
	const original = `packages/core/src/components/base/collection/engine/transactions/${name}`
	writeFileSync(resolve(directory, name), execFileSync('git', ['show', `${commit}:${original}`]))
}
function once(code, from, to) {
	assert.equal(code.split(from).length, 2, `Instrumentation anchor must occur once: ${from}`)
	return code.replace(from, to)
}

/** Tools-only wiring of PR #892 receipts to PR #900 assemblies. No early item insertion. */
export function rollbackProbe() {
	return {
		name: 'ssr-acceptance-rollback-probe',
		enforce: 'pre',
		transform(original, id) {
			if (!id.replaceAll('\\', '/').endsWith('/adapter/runtime/useAdapterContext.ts')) return
			let code =
				`import { TCollectionTransactions } from '${resolve(directory, 'transactions.class.ts').replaceAll('\\', '/')}'\n` +
				original
			code = once(
				code,
				'const drafts = new TDrafts()',
				'const drafts = new TDrafts()\nconst probeTransactions = new TCollectionTransactions<object>()',
			)
			code = once(
				code,
				'private _destroyed = false',
				`private _destroyed = false
	private _receipt?: ReturnType<typeof probeTransactions.begin>
	prepare(): void {
		this._receipt = probeTransactions.begin(this, { owner: this, timeout: 1000, rollback: this.destroy })
	}`,
			)
			code = once(code, 'accept(): void {', 'accept(): void {\n\t\tthis._receipt?.commit()')
			code = once(
				code,
				'destroyAll(this.contexts)\n\t\tthis._destroyed = true',
				`if (this._destroyed) return
		this._destroyed = true
		this._receipt?.cancel()
		drafts.accept(this.held)
		destroyAll(this.contexts)`,
			)
			code = once(
				code,
				'drafts.add(held, built.destroy, id)',
				'drafts.add(held, built.destroy, id)\n\t\tbuilt.prepare()',
			)
			code = once(code, 'if (!ref.current) {', 'if (!ref.current || ref.current.destroyed) {')
			return code
		},
	}
}

if (process.argv.includes('--build')) {
	await build({
		configFile: false,
		root: resolve(import.meta.dirname, '../..'),
		plugins: [rollbackProbe(), react()],
		build: {
			outDir: resolve(import.meta.dirname, 'results/rollback-adapter'),
			emptyOutDir: true,
			minify: false,
			lib: {
				entry: resolve(import.meta.dirname, '../../packages/ui/react/src/index.ts'),
				formats: ['es'],
				fileName: 'index',
			},
			rollupOptions: { external: (id) => /^(react(?:-dom)?(?:\/|$)|@soxa-ui\/)/.test(id) },
		},
	})
}
