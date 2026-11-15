/**
 * Ожидание: подключение, пришедшее, пока подключается другой элемент, идёт
 * сразу после него, в порядке прихода. AGENTS.md (Web Components), «Ожидание».
 */

let depth = 0

/** Разбор очереди идёт: подключение из неё очередь не разбирает — его пришедшее заберёт тот же цикл. */
let draining = false

const waiting: ((() => void) | undefined)[] = []

export function isConnecting(): boolean {
	return depth > 0
}

/** Подключение: пришедшее во время него ждёт конца внешнего подключения. */
export function connecting(run: () => void): void {
	depth += 1

	try {
		run()
	} finally {
		depth -= 1

		if (depth === 0 && !draining) drainAll()
	}
}

export function wait(resume: () => void): void {
	waiting.push(resume)
}

/** Один разбор на всё подключение: вложенный разбор растил бы стек на каждый ждущий элемент. */
function drainAll(): void {
	draining = true

	try {
		runAll(drain())
	} finally {
		draining = false
	}
}

function* drain(): Generator<() => void> {
	try {
		// Read the live tail for callbacks appended during draining; release each before running it.
		for (let index = 0; index < waiting.length; index += 1) {
			const next = waiting[index]
			waiting[index] = undefined

			if (next) yield next
		}
	} finally {
		waiting.length = 0
	}
}

/** Выполнить всё: упавшая задача остальных не держит, первая ошибка уходит дальше. */
export function runAll(tasks: Iterable<() => void>): void {
	let failed = false
	let failure: unknown

	for (const task of tasks) {
		try {
			task()
		} catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}

	if (failed) throw failure
}
