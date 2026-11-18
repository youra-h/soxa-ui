import { compile } from '@tailwindcss/node'
import ts from 'typescript'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const folder = resolve(import.meta.dirname, 'shadcn')
const candidates = new Set()
for (const name of ['tabs', 'toggle', 'toggle-group']) {
	const source = ts.createSourceFile(
		name + '.tsx',
		readFileSync(resolve(folder, name + '.tsx'), 'utf8'),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	)
	function visit(node) {
		if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
			for (const token of node.text.split(/\s+/)) if (token) candidates.add(token)
		ts.forEachChild(node, visit)
	}
	visit(source)
}
const builder = await compile(readFileSync(resolve(folder, 'globals.css'), 'utf8'), {
	base: folder,
	onDependency() {},
})
writeFileSync(resolve(folder, 'styles.css'), builder.build([...candidates]))
