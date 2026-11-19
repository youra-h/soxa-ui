/**
 * The application's teardown, the only moment Angular announces before any
 * view goes.
 *
 * Angular destroys a removed tree children first, with no hook on a parent
 * before them, so the items of a collection leave it one by one while their
 * siblings still listen: every departure moved the order and the activity of
 * the rest, and on the server every request ended with that quadratic
 * cascade. `ApplicationRef` calls its `onDestroy` listeners before destroying
 * its views, so there every context of the application is detached at once.
 */

import { ApplicationRef, inject } from '@angular/core'
import type { IAdapterContext } from '@soxa-ui/setup'

type TDetachable = Pick<IAdapterContext, 'detach'>

/** Live contexts per application: one listener on it, a set entry per context. */
const applications = new WeakMap<ApplicationRef, Set<TDetachable>>()

/** The contexts the current application detaches when it starts coming down. */
export function appTeardown(): Set<TDetachable> {
	const app = inject(ApplicationRef)

	return applications.get(app) ?? listen(app)
}

function listen(app: ApplicationRef): Set<TDetachable> {
	const contexts = new Set<TDetachable>()

	applications.set(app, contexts)

	app.onDestroy(() => {
		applications.delete(app)

		for (const context of contexts) context.detach()

		contexts.clear()
	})

	return contexts
}
