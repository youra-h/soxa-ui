export function snapshot(document, root = document.body) {
	const visible = (element) =>
		!element.closest('[hidden]') && !element.closest('[style*="display: none"]')
	const tabs = [...root.querySelectorAll('[role="tab"]')].filter(visible).map((tab) => ({
		text: tab.textContent,
		id: tab.id,
		selected: tab.getAttribute('aria-selected'),
		tabIndex: tab.getAttribute('tabindex'),
		controls: tab.getAttribute('aria-controls'),
		targetExists: !!document.getElementById(tab.getAttribute('aria-controls')),
	}))
	const panels = [...root.querySelectorAll('[role="tabpanel"]')].filter(visible).map((panel) => ({
		text: panel.textContent,
		id: panel.id,
		labelledBy: panel.getAttribute('aria-labelledby'),
		labelExists: !!document.getElementById(panel.getAttribute('aria-labelledby')),
	}))
	return {
		tabs,
		panels,
		tabStops: tabs.filter((tab) => tab.tabIndex === '0').length,
		selectedTabs: tabs.filter((tab) => tab.selected === 'true').map((tab) => tab.text),
		fallback: !!root.querySelector('[data-fallback]'),
	}
}
