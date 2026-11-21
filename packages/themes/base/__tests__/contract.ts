import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { writtenVariables } from './behaviour'

/**
 * Public variables shared by base and visual themes. Base reads and optional
 * geometry defaults belong to base-reads. Theme-reads contains values written
 * by base or code, plus optional visual settings that a theme can supply.
 * The base CSS and compiled-theme guards consume the same two sections.
 */

const BASE = resolve(import.meta.dirname, '..')
const PACKAGES = resolve(BASE, '../..')

/** Раздел контракта: имя переменной `--so-*` и что она значит. */
export type TSection = Readonly<Record<string, unknown>>

export type TContract = {
	/** Имена разделов в файле — их ровно два. */
	readonly sections: readonly string[]
	readonly baseReads: TSection
	readonly themeReads: TSection
}

const isRecord = (value: unknown): value is TSection =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

function sectionOf(parsed: TSection, name: string): TSection {
	const section = parsed[name]

	if (!isRecord(section)) throw new Error(`theme-variables.json: нет раздела «${name}»`)

	return section
}

function readContract(): TContract {
	const parsed: unknown = JSON.parse(readFileSync(join(BASE, 'theme-variables.json'), 'utf8'))

	if (!isRecord(parsed)) throw new Error('theme-variables.json: ожидается объект JSON')

	return {
		sections: Object.keys(parsed),
		baseReads: sectionOf(parsed, 'base-reads'),
		themeReads: sectionOf(parsed, 'theme-reads'),
	}
}

export const CONTRACT = readContract()

/** Что читает база и не объявляет сама, и её умолчания для темы. */
export const BASE_READS: readonly string[] = Object.keys(CONTRACT.baseReads)

/** Additional public reads, including optional visual settings declared by base. */
export const THEME_READS: readonly string[] = Object.keys(CONTRACT.themeReads)

/**
 * Переменные, которые пишет код: библиотека — ядро, плагины, setup — и
 * плагины раскладки базы, которые ставит тема. Адаптеры только раскладывают
 * то, что им отдали, и своих переменных не пишут.
 */
export const CODE_WRITES: ReadonlySet<string> = new Set(
	[
		writtenVariables(join(PACKAGES, 'core/src'), 'core'),
		writtenVariables(join(PACKAGES, 'plugins/src'), 'plugins'),
		writtenVariables(join(PACKAGES, 'setup/content'), 'setup/content'),
		writtenVariables(join(PACKAGES, 'setup/protected'), 'setup/protected'),
		writtenVariables(join(BASE, 'setup'), 'theme-base/setup'),
	]
		.flat()
		.map(({ name }) => name),
)
