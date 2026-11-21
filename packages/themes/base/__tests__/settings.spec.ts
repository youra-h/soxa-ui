import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'
import { THEME_READS } from './contract'

const settings = postcss.parse(
	readFileSync(join(import.meta.dirname, '../src/settings.css'), 'utf8'),
)
describe('optional shared theme settings', () => {
	it('leaves every setting unset until a visual theme supplies it', () => {
		const invalid: string[] = []
		settings.walkDecls((decl) => {
			if (decl.value !== 'initial') invalid.push(decl.prop)
		})
		expect(invalid).toEqual([])
	})
	it('names visual-only settings in the public contract and gives them no base default', () => {
		const names: string[] = []
		settings.walkDecls((decl) => {
			if (decl.prop.includes('radius')) names.push(decl.prop)
		})
		expect(names.length).toBeGreaterThan(1)
		expect(names.filter((name) => !THEME_READS.includes(name))).toEqual([])
	})
})
