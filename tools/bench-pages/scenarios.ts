/**
 * Page scenarios — what a user does with a component: press, type, open and
 * close an overlay, select, scroll. Shared by all frameworks: the hosts'
 * previews are the same, and so is the parts' markup (the `so-*` classes).
 *
 * A scenario acts on the first `act` copies of the page and returns how many
 * actions it made. Events are sent from the page script, with the full pointer
 * chain (`pointerdown` … `click`): plugins listen to both the press and the
 * click. Typing is `insertText`, the way the browser inserts it (`beforeinput`
 * and `input`). Every user action goes through `action`: a decider, if set, is
 * asked before it, an observer, if set, hears of it after.
 */
export type TScenario = (
	scope: HTMLElement,
	act: number,
	update: (props: Readonly<Record<string, unknown>>) => void,
) => Promise<number>

/**
 * Observer of the scenario's steps: called after every user action with its
 * label (`press so-select__arrow`), and the scenario waits for it. The parity
 * run (`parity.mjs`) records the component's events and the accessibility tree
 * there; the page run has no observer.
 */
export type TStepObserver = (label: string) => Promise<void>

/**
 * What to do with a user action: `do` it, `skip` it, or `stop` — do it and
 * end the scenario at once, before the frames after it: the scenario throws
 * `TScenarioStopped`, and its caller takes the page down in the middle of the
 * action.
 */
export type TStepDecision = 'do' | 'skip' | 'stop'

/**
 * Decider of the scenario's steps: asked before every user action with its
 * label, and the scenario waits for the answer. The soak session (`soak.mjs`)
 * decides at random; the other runs have no decider, and every action is done.
 */
export type TStepDecider = (label: string) => Promise<TStepDecision>

/** The scenario its decider stopped right after the action `label`. */
export class TScenarioStopped extends Error {
	readonly label: string

	constructor(label: string) {
		super(`[bench-pages] сценарий остановлен: ${label}`)
		this.label = label
	}
}

let observer: TStepObserver | undefined
let decider: TStepDecider | undefined

/** Set or clear the step observer. */
export function observeSteps(next: TStepObserver | undefined): void {
	observer = next
}

/** Set or clear the step decider. */
export function decideSteps(next: TStepDecider | undefined): void {
	decider = next
}

/** End of a user action: the observer gets its label. */
export async function step(label: string): Promise<void> {
	await observer?.(label)
}

/** Nothing to wait for after an action. */
function atOnce(): Promise<void> {
	return Promise.resolve()
}

/**
 * A user action: the decider has its say (without one the action is done),
 * `run` sends the input, `after` waits for what it set going — two frames
 * unless told otherwise — and the observer gets the label. Returns the actions
 * made: 1, or 0 if skipped.
 */
export async function action(
	label: string,
	run: () => void,
	after: () => Promise<void> = frames,
): Promise<number> {
	const decision = decider ? await decider(label) : 'do'

	if (decision === 'skip') return 0

	run()

	if (decision === 'stop') throw new TScenarioStopped(label)

	await after()
	await step(label)

	return 1
}

/**
 * A node in a step label: its part class (`so-select__arrow`), otherwise its
 * block class, otherwise its tag. Not the first class: their order on a node
 * is the adapter's, not a contract.
 */
export function describe(element: Element): string {
	const classes = [...element.classList]
		.filter((name) => name.startsWith('so-') && !name.includes('--'))
		.sort()

	return classes.find((name) => name.includes('__')) ?? classes[0] ?? element.localName
}

export function frame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

export async function frames(count = 2): Promise<void> {
	for (let index = 0; index < count; index++) await frame()
}

export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/** A pointer event at the node's vertical middle, `at` of its width across. */
export function pointer(element: Element, type: string, at = 0.5): void {
	const box = element.getBoundingClientRect()
	const init: PointerEventInit = {
		bubbles: true,
		cancelable: true,
		composed: true,
		pointerId: 1,
		pointerType: 'mouse',
		isPrimary: true,
		button: 0,
		buttons: type === 'pointerdown' || type === 'mousedown' ? 1 : 0,
		clientX: box.left + box.width * at,
		clientY: box.top + box.height / 2,
	}

	element.dispatchEvent(
		type.startsWith('mouse') ? new MouseEvent(type, init) : new PointerEvent(type, init),
	)
}

/** A mouse press: pointer, focus and click, as in a real press. */
export async function press(element: Element | null | undefined, at = 0.5): Promise<number> {
	if (!(element instanceof HTMLElement)) return 0

	return action(`press ${describe(element)}`, () => {
		pointer(element, 'pointerdown', at)
		pointer(element, 'mousedown', at)
		element.focus({ preventScroll: true })
		pointer(element, 'pointerup', at)
		pointer(element, 'mouseup', at)
		element.click()
	})
}

/** A key on the node: `keydown` and `keyup`. */
export async function key(element: Element | null | undefined, name: string): Promise<number> {
	if (!element) return 0

	const init: KeyboardEventInit = { key: name, bubbles: true, cancelable: true, composed: true }

	return action(`key ${name} ${describe(element)}`, () => {
		element.dispatchEvent(new KeyboardEvent('keydown', init))
		element.dispatchEvent(new KeyboardEvent('keyup', init))
	})
}

/**
 * Escape to the focused node, as from the keyboard. If the focus has left the
 * open panel, to the panel itself: the layer listens to Escape, not the
 * document.
 */
export function escape(panel?: HTMLElement | null): Promise<number> {
	const focused = document.activeElement

	return key(panel && !panel.contains(focused) ? panel : (focused ?? document.body), 'Escape')
}

/** Typing into a field: focus and text insertion, then the focus leaves. */
export async function type(element: Element | null | undefined, text: string): Promise<number> {
	if (!(element instanceof HTMLElement)) return 0

	return action(
		`type "${text}" ${describe(element)}`,
		() => {
			element.focus({ preventScroll: true })
			document.execCommand('insertText', false, text)
		},
		async () => {
			await frames()
			element.blur()
		},
	)
}

/** The first `act` nodes by the selector — one per copy. */
export function first<T extends Element = HTMLElement>(
	scope: Element,
	selector: string,
	act: number,
): T[] {
	return [...scope.querySelectorAll<T>(selector)].slice(0, act)
}

/** An open layer panel by its class — the layer teleports panels to the end of the document. */
export function open(selector: string): HTMLElement | null {
	return document.querySelector<HTMLElement>(`${selector}[data-open="true"]`)
}

/** The button with the given label inside the node. */
export function button(scope: Element, text: string): HTMLElement | undefined {
	return [...scope.querySelectorAll<HTMLElement>('.so-button')].find(
		(node) => node.textContent?.trim() === text,
	)
}

/** The first `act` buttons with the label — one per copy. */
export function labelled(scope: Element, text: string, act: number): HTMLElement[] {
	return [...scope.querySelectorAll<HTMLElement>('.so-button')]
		.filter((node) => node.textContent?.trim() === text)
		.slice(0, act)
}

/** A scenario run on each of the `act` copies: the sum of their actions. */
export function each(selector: string, run: (copy: HTMLElement) => Promise<number>): TScenario {
	return async (scope, act) => {
		let done = 0

		for (const copy of first(scope, selector, act)) done += await run(copy)

		return done
	}
}

/** Open an overlay with a button, act inside it, and close it with Escape. */
export async function overlay(
	opener: Element | null | undefined,
	panel: string,
	inside?: (node: HTMLElement) => Promise<number>,
): Promise<number> {
	let done = await press(opener)

	await frames()

	const node = open(panel)

	if (node && inside) done += await inside(node)

	done += await escape(node)

	return done
}

/** Missing targets on audited pages are coverage failures, never zero-action success. */
export const AUDITED_PAGES: readonly string[] = [
	'alert',
	'badge',
	'breadcrumbs',
	'separator',
	'toggle-button',
	'toggle-group',
	'code-block',
	'avatar',
	'avatar-group',
	'alert-dialog',
]

function required(scope: ParentNode, selector: string): HTMLElement {
	const node = scope.querySelector(selector)

	if (!(node instanceof HTMLElement)) throw new Error('Missing audited target: ' + selector)

	return node
}

async function checkedPress(element: HTMLElement, check: () => boolean): Promise<number> {
	const done = await press(element)

	if (done && !check())
		throw new Error('Audited action did not change state: ' + describe(element))

	return done
}

async function avatarStatus(scope: ParentNode, status: string): Promise<void> {
	const deadline = performance.now() + 4000

	while (
		![...scope.querySelectorAll<HTMLElement>('.so-avatar')].every(
			(node) => node.dataset.status === status,
		)
	) {
		if (performance.now() > deadline) throw new Error('Avatar did not reach ' + status)

		await frame()
	}
}

function auditedEach(selector: string, run: (copy: HTMLElement) => Promise<number>): TScenario {
	return async (scope, act) => {
		const copies = first(scope, selector, act)

		if (copies.length !== act) throw new Error('Missing audited copies: ' + selector)

		let done = 0

		for (const copy of copies) done += await run(copy)

		return done
	}
}

export const SCENARIOS: Record<string, TScenario> = {
	alert: auditedEach('.so-alert', async (copy) => {
		return press(required(copy, '.so-alert__close'))
	}),
	badge: async (scope, _act, update) => {
		required(scope, '.so-badge__indicator')
		let done = await action('badge capped', () => update({ value: 120, max: 99 }))

		done += await action('badge zero', () => update({ value: 0 }))
		done += await action('badge text', () => update({ value: 'New' }))
		done += await action('badge dot', () => update({ dot: true, aria_label: 'New updates' }))

		return done
	},
	avatar: async (scope, _act, update) => {
		required(scope, '.so-avatar')
		let done = await action('avatar initials', () =>
			update({ initials: 'GH', aria_label: 'Grace' }),
		)

		done += await action(
			'avatar image',
			() =>
				update({
					initials: 'GH',
					aria_label: 'Grace',
					src:
						'data:image/svg+xml,' +
						encodeURIComponent(
							'<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>',
						),
				}),
			() => avatarStatus(scope, 'loaded'),
		)
		done += await action(
			'avatar error',
			() =>
				update({
					src: 'data:image/png;base64,broken',
					initials: 'GH',
					aria_label: 'Grace',
				}),
			() => avatarStatus(scope, 'error'),
		)

		done += await action('avatar fallback', () =>
			update({ src: '', initials: 'GH', aria_label: 'Grace' }),
		)

		return done
	},
	'avatar-group': async (scope, _act, update) => {
		required(scope, '.so-avatar-group')
		return (
			(await action('avatar group no overflow', () => update({ overflow: 0 }))) +
			(await action('avatar group overflow', () => update({ overflow: 5 })))
		)
	},
	breadcrumbs: auditedEach('.so-breadcrumbs', async (copy) => {
		const trigger = required(copy, '.so-breadcrumbs__trigger')
		let done = await checkedPress(
			trigger,
			() =>
				required(copy, '.so-breadcrumbs__trigger').getAttribute('aria-expanded') === 'true',
		)
		const panel = open('.so-menu__panel')

		if (panel) done += await key(panel.querySelector('[role="menuitem"]'), 'ArrowDown')
		done += await escape(panel)

		return done
	}),
	'toggle-button': auditedEach('.so-toggle-button', async (copy) => {
		const before = copy.getAttribute('aria-pressed')
		const done = await checkedPress(copy, () => copy.getAttribute('aria-pressed') !== before)

		return done + (await press(copy))
	}),
	'toggle-group': auditedEach('.so-toggle-group', async (copy) => {
		const items = copy.querySelectorAll<HTMLElement>('.so-toggle-group-item')

		if (items.length < 3) throw new Error('Missing ToggleGroup items')

		const before = items[0].getAttribute('aria-pressed')
		let done = await checkedPress(
			items[0],
			() => items[0].getAttribute('aria-pressed') !== before,
		)

		done += await key(items[0], 'End')
		done += await press(items[2])
		done += await key(items[2], 'Home')

		return done
	}),
	'code-block': auditedEach('.so-code-block', async (copy) => {
		const tabs = copy.querySelectorAll<HTMLElement>('[role="tab"]')

		if (tabs.length !== 2) throw new Error('Missing CodeBlock snippet tabs')

		let done = await checkedPress(
			tabs[1],
			() => tabs[1].getAttribute('aria-selected') === 'true',
		)

		done += await press(required(copy, '.so-code-block__copy'))
		done += await press(tabs[0])

		return done
	}),
	separator: async (scope, _act, update) => {
		required(scope, '.so-separator')
		let done = await action('separator decorative', () => update({ decorative: true }))

		done += await action('separator vertical decorative', () =>
			update({ orientation: 'vertical', decorative: true }),
		)
		done += await action('separator vertical semantic', () =>
			update({ orientation: 'vertical', decorative: false }),
		)
		done += await action('separator horizontal semantic', () =>
			update({ orientation: 'horizontal', decorative: false }),
		)

		return done
	},
	button: each('.so-button', press),
	input: each('.so-input input', (field) => type(field, 'abc')),
	'number-input': each('.so-number-input', async (copy) => {
		const field = copy.querySelector('input.so-number-input__input')
		let done = await key(field, 'ArrowUp')

		done += await press(copy.querySelector('.so-number-input__increment'))
		done += await type(field, '7')

		return done
	}),
	textarea: each('.so-textarea textarea', (field) => type(field, 'abc')),
	'check-box': each('.so-label', press),
	switch: each('.so-label', press),
	label: each('.so-label', press),
	field: each('.so-field input', (field) => type(field, 'name@example.com')),
	slider: each('.so-slider__track', (track) => press(track, 0.7)),
	rating: each('.so-rating', (copy) => press(copy.querySelectorAll('.so-rating__star')[3])),
	'radio-group': each('.so-radio-group', async (copy) => {
		const items = copy.querySelectorAll('.so-radio-group-item')

		return (await press(items[1])) + (await press(items[2]))
	}),
	// An editable field (the preview's `editable`): the arrow and typing open the panel
	select: each('.so-select', async (copy) => {
		const arrow = copy.querySelector('.so-select__arrow')
		let done = await press(arrow)

		await frames()
		done += await press(open('.so-select__panel')?.querySelector('[role="option"]'))
		done += await overlay(arrow, '.so-select__panel')
		done += await type(copy.querySelector('.so-select__field input'), 'Вт')

		return done
	}),
	calendar: each('.so-calendar', async (copy) => {
		let done = await press(copy.querySelectorAll('.so-calendar-item')[4])

		done += await press(copy.querySelector('.so-calendar__next'))
		done += await overlay(copy.querySelector('.so-calendar__title'), '.so-popover__panel')

		return done
	}),
	'date-input': each('.so-date-input', async (copy) => {
		const segment = copy.querySelector('.so-date-input__segment')
		let done = 0

		for (const digit of ['1', '0']) done += await key(segment, digit)

		done += await key(segment, 'ArrowUp')

		return done
	}),
	'date-picker': each('.so-date-picker', async (copy) => {
		const trigger = copy.querySelector('.so-date-picker__trigger')
		const day = (index: number) =>
			open('.so-date-picker__panel')?.querySelectorAll('.so-calendar-item')[index]
		let done = await press(trigger)

		await frames()
		done += await press(day(9))

		// Confirmable (the parity page's DatePicker): the choice is a draft until
		// the footer's buttons — "Cancel" closes the panel and drops it, open
		// again, choose and "Done" applies it. The page run's DatePicker has no
		// footer, and its steps stay as they were
		const cancel = open('.so-date-picker__panel')?.querySelector('.so-date-picker__cancel')

		if (cancel) {
			done += await press(cancel)
			done += await press(trigger)
			await frames()
			done += await press(day(10))
			done += await press(
				open('.so-date-picker__panel')?.querySelector('.so-date-picker__confirm'),
			)
		}

		done += await overlay(trigger, '.so-date-picker__panel')

		return done
	}),
	popover: each('.so-popover', (copy) =>
		overlay(copy.querySelector('.so-button'), '.so-popover__panel'),
	),
	menu: each('.so-menu', async (copy) => {
		const trigger = copy.querySelector('.so-button')
		let done = await overlay(trigger, '.so-menu__panel', (panel) =>
			press(panel.querySelector('[role="menuitemcheckbox"]')),
		)

		done += await press(trigger)
		await frames()
		done += await press(open('.so-menu__panel')?.querySelector('[role="menuitem"]'))

		return done
	}),
	tooltip: async (scope, act) => {
		const triggers = first(scope, '.so-tooltip .so-button', act)
		let done = 0

		// Hover waits for the open delay (400 ms), on the first copy only; the
		// focus opens at once, on every copy. Hover and leave are one action,
		// focus and blur too
		const hovered = triggers[0]

		if (hovered) {
			const label = describe(hovered)
			const entered = await action(
				`hover ${label}`,
				() => pointer(hovered, 'pointerenter'),
				async () => {
					await wait(450)
					await frames()
				},
			)

			if (entered) {
				await action(`leave ${label}`, () => pointer(hovered, 'pointerleave'), atOnce)
				done += 1
			}
		}

		for (const trigger of triggers) {
			const label = describe(trigger)
			const focused = await action(
				`focus ${label}`,
				() => trigger.focus({ preventScroll: true }),
				() => frames(3),
			)

			if (focused) {
				await action(`blur ${label}`, () => trigger.blur(), atOnce)
				done += 1
			}
		}

		await frames()

		return done
	},
	'alert-dialog': async (scope, act) => {
		const openers = labelled(scope, 'Открыть окно', act)

		if (openers.length !== act) throw new Error('Missing AlertDialog openers')

		let done = 0

		for (const opener of openers) {
			done += await press(opener)

			const panel = open('.so-alert-dialog')

			if (panel) done += await press(required(panel, '.so-alert-dialog__cancel'))

			done += await press(opener)

			const reopened = open('.so-alert-dialog')

			if (reopened) done += await press(required(reopened, '.so-alert-dialog__action'))
		}

		return done
	},
	dialog: async (scope, act) => {
		let done = 0

		for (const opener of labelled(scope, 'Открыть окно', act)) {
			done += await overlay(opener, '.so-dialog', (panel) =>
				type(panel.querySelector('input'), 'Анна'),
			)
		}

		return done
	},
	drawer: async (scope, act) => {
		let done = 0

		for (const opener of labelled(scope, 'Открыть панель', act)) {
			done += await overlay(opener, '.so-drawer', (panel) =>
				type(panel.querySelector('input'), 'Анна'),
			)
		}

		return done
	},
	toasts: async (scope, act) => {
		let done = 0

		for (const copy of labelled(scope, 'обычное', act).map((node) => node.parentElement)) {
			if (!copy) continue

			for (const text of ['обычное', 'success', 'загрузка → готово']) {
				done += await press(button(copy, text))
			}
		}

		return done
	},
	scroller: each('.so-scroller', async (copy) => {
		const viewport = copy.querySelector('.so-scroller__viewport')
		const scrolled = await action('scroll so-scroller__viewport', () =>
			viewport?.scrollBy({ left: 200 }),
		)

		return scrolled + (await press(copy.querySelector('.so-scroller__prev')))
	}),
	'list-box': each('.so-list-box', async (copy) => {
		const options = copy.querySelectorAll('[role="option"]')

		return (await press(options[1])) + (await press(options[3]))
	}),
	pagination: each('.so-pagination', async (copy) => {
		let done = await press(copy.querySelector('.so-pagination__next'))

		done += await press(button(copy, '1'))

		return done
	}),
	table: each('.so-table', async (copy) => {
		const sort = copy.querySelector('.so-table-column__sort')
		let done = (await press(sort)) + (await press(sort))

		done += await press(copy.querySelector('.so-table-row__cell'))

		return done
	}),
	tabs: each('.so-tabs', async (copy) => {
		const tabs = copy.querySelectorAll('[role="tab"]')

		return (await press(tabs[1])) + (await press(tabs[2]))
	}),
	stepper: each('.so-stepper', async (copy) => {
		const steps = copy.querySelectorAll('button.so-stepper-item__trigger')

		return (await press(steps[0])) + (await press(steps[2]))
	}),
	tags: each('.so-tags', async (copy) => {
		const tags = copy.querySelectorAll('[role="listitem"]')

		return (await press(tags[1])) + (await key(tags[1], 'ArrowRight'))
	}),
	accordion: each('.so-accordion', async (copy) => {
		const headers = copy.querySelectorAll('.so-accordion-item__header')

		return (await press(headers[0])) + (await press(headers[1]))
	}),
	'drag-and-drop': each('.so-tabs', (copy) => press(copy.querySelectorAll('[role="tab"]')[2])),
	virtual: async (scope, act) => {
		let done = 0

		for (const list of first(scope, '.so-list-box__list', act)) {
			// The window's nearest ancestor with its own scroll is the one to scroll
			let scroller: HTMLElement | null = list

			while (scroller && scroller.scrollHeight <= scroller.clientHeight) {
				scroller = scroller.parentElement
			}

			if (!scroller || scroller === document.documentElement) continue

			// To the end and back to the start is one action
			const target = scroller
			const label = describe(target)
			const ended = await action(
				`scroll end ${label}`,
				() => {
					target.scrollTop = target.scrollHeight
				},
				() => frames(3),
			)
			const started = await action(
				`scroll start ${label}`,
				() => {
					target.scrollTop = 0
				},
				() => frames(3),
			)

			if (ended || started) done += 1
		}

		return done
	},
}
