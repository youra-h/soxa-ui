/**
 * The application's teardown, the only moment Angular announces before any
 * view goes.
 *
 * Angular destroys a removed tree children first, with no hook on a parent
 * before them, so the items of a collection leave it one by one while their
 * siblings still listen: every departure moved the order and the activity of
 * the rest, and on the server every request ended with that quadratic
 * cascade. `ApplicationRef` calls its `onDestroy` listeners before destroying
 * its views, so there every binding of the application stops at once.
 */

import { ApplicationRef, inject } from '@angular/core'

/** Live teardown callbacks per application: one listener on it, not one per component. */
const teardowns = new WeakMap<ApplicationRef, Set<() => void>>()

/** Run `teardown` when the application starts coming down; the returned call forgets it. */
export function onAppTeardown(teardown: () => void): () => void {
	const app = inject(ApplicationRef)
	const registered = teardowns.get(app) ?? listen(app)

	registered.add(teardown)

	return () => registered.delete(teardown)
}

function listen(app: ApplicationRef): Set<() => void> {
	const registered = new Set<() => void>()

	teardowns.set(app, registered)

	app.onDestroy(() => {
		teardowns.delete(app)

		for (const each of registered) each()

		registered.clear()
	})

	return registered
}
