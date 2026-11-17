import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import base from '../vitest.config.ts'

const journal = path.join(import.meta.dirname, 'journal.ts').replaceAll('\\', '/')
export default defineConfig({
	resolve: base.resolve,
	plugins: [
		{
			name: 'pending-registration-commit-rollback',
			enforce: 'pre',
			transform(source, id) {
				const file = id.replaceAll('\\', '/')
				if (file.endsWith('/content/extensions/collection/collection.extension.class.ts')) {
					const attach = "context.events.on('attach', () => context.instance.bindOwner())"
					const destroy =
						"context.events.on('destroy', () => context.instance.releaseOwner())"
					if (!source.includes(attach) || !source.includes(destroy))
						throw new Error('Collection owner anchor changed')
					return (
						`import {registrations} from ${JSON.stringify(journal)}\n` +
						source
							.replace(
								attach,
								"context.events.on('attach', () => {context.instance.bindOwner();registrations.acceptOwner(engine,context)})",
							)
							.replace(
								destroy,
								"context.events.on('destroy', () => {context.instance.releaseOwner();registrations.releaseOwner(engine,context)})",
							)
					)
				}
				if (file.endsWith('/adapter/runtime/useAdapterContext.ts')) {
					const create =
						'return createAdapterContext(descriptor, { mountId: id, locale, ...options }, config)'
					const assembly =
						'const built = new TBuilt(factory(create, scope.elevator), scope, held)'
					if (!source.includes(create) || !source.includes(assembly))
						throw new Error('Runtime anchor changed')
					return (
						`import {registrations} from ${JSON.stringify(journal)}\n` +
						source
							.replace(
								'const held: object[] = []',
								'const held: object[] = []\nconst created: IAdapterContext[] = []',
							)
							.replace(
								create,
								`const context=createAdapterContext(descriptor, { mountId: id, locale, ...options }, config)\ncreated.push(context)\nreturn context`,
							)
							.replace(
								assembly,
								`let contexts:T\ntry { contexts=factory(create, scope.elevator) } catch(error) { registrations.forget(created);destroyAll(created);throw error }\nconst built=new TBuilt(contexts,scope,held)\nregistrations.bind(built)`,
							)
							.replace(
								'if (!ref.current) {',
								'if (!ref.current || ref.current.destroyed) {\nif(ref.current)registrations.counters.rebuild++',
							)
							.replace(
								'ref.current = rebuild()',
								'registrations.counters.rebuild++\nref.current = rebuild()',
							)
							.replace(
								'destroyAll(this.contexts)',
								'if(this._destroyed)return\nthis._destroyed=true\ndrafts.accept(this.held)\nregistrations.forget(listOf(this.contexts))\ndestroyAll(this.contexts)',
							)
					)
				}
				if (
					file.endsWith(
						'/content/extensions/collection/collection-item.extension.class.ts',
					)
				) {
					const attach = "\t\tcontext.events.on('attach', () => {"
					const start = source.indexOf('\t\t\tconst grouped =', source.indexOf(attach))
					const end = source.indexOf(
						'\n',
						source.indexOf('\t\t\tmetaOf<object>(engine)?.apply', start),
					)
					const ending = source.lastIndexOf('\n\t}\n}')
					if (start < 0 || end < 0 || ending < 0)
						throw new Error('Collection extension anchor changed')
					const native = source
						.slice(start, end)
						.replace('\t\t\tmembers?.add(adapter, context)\n', '')
					source =
						source.slice(0, ending) +
						'\n\t\tif(engine && register)transaction=registrations.prepare(context,engine,item,enter)\n' +
						source.slice(ending)
					source =
						source.slice(0, start) +
						'\t\t\tif(transaction)registrations.commit(transaction)\n\t\t\telse enter()\n\t\t\tmembers?.add(adapter, context)' +
						source.slice(end)
					source = source.replace(
						attach,
						`let transaction:ReturnType<typeof registrations.prepare>|undefined\nconst enter=():void=>{${native}}\n${attach}`,
					)
					return `import {registrations} from ${JSON.stringify(journal)}\n` + source
				}
			},
		},
		react(),
	],
	test: { ...base.test, include: ['tools/react-early-attach/transactions/*.spec.tsx'] },
})
