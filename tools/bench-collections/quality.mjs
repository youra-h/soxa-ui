export function quality(root, n, kind, library = 'soxa') {
	const all = [
		...root.querySelectorAll(
			kind === 'tabs' ? '[role="tab"]' : '[role="option"], [data-bench-option]',
		),
	]
	const selected = all.filter(
		(el) =>
			el.getAttribute('aria-selected') === 'true' ||
			el.getAttribute('aria-pressed') === 'true' ||
			el.getAttribute('aria-checked') === 'true',
	)
	// A focusable tab panel is allowed; the tab list itself must have one stop.
	const stops =
		kind === 'tabs'
			? all.filter((el) => el.getAttribute('tabindex') === '0')
			: [...root.querySelectorAll('[tabindex="0"]')]
	const panels = [...root.querySelectorAll('[role="tabpanel"]')].filter(
		(el) => !el.hidden && el.style.display !== 'none' && el.textContent.trim(),
	)
	const active = selected[0]
	const panel = panels[0]
	const doc = root.ownerDocument ?? root
	const reciprocal =
		kind !== 'tabs' ||
		Boolean(
			panel &&
			active &&
			active.getAttribute('aria-controls') === panel.id &&
			panel.getAttribute('aria-labelledby') === active.id &&
			doc.getElementById(panel.id) === panel,
		)
	const checks = {
		count: all.length === n,
		selected: selected.length === 1 && all.indexOf(active) === 1,
		oneTabStop: stops.length === 1,
		panel: kind !== 'tabs' || (panels.length === 1 && panel.textContent.trim() === 'Panel 1'),
		reciprocal,
	}
	return {
		valid:
			checks.count &&
			checks.selected &&
			checks.panel &&
			checks.reciprocal &&
			(library === 'soxa' ? checks.oneTabStop : true),
		checks,
		focusPolicy:
			library === 'soxa'
				? 'one explicit collection stop'
				: 'native focus model; client Tab entry checked separately',
		items: all.length,
		selected: selected.length,
		stops: stops.length,
		panels: panels.length,
	}
}
