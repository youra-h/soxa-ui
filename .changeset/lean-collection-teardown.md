---
'@soxa-ui/core': patch
'@soxa-ui/plugins': patch
'@soxa-ui/setup': patch
'@soxa-ui/angular': patch
'@soxa-ui/react': patch
'@soxa-ui/solid': patch
'@soxa-ui/svelte': patch
'@soxa-ui/vue': patch
'@soxa-ui/webc': patch
---

Faster Tabs and Tags on large collections, especially declarative items rendered on the server.

- A collection item's `change:order` is emitted only when its own position changed; appending an item no longer notifies every sibling. Item order is memoized per storage write instead of copying the collection on every read.
- Activation and selection update `data-selected` only on the items whose state changed.
- Angular detaches every binding when the application starts tearing down, so server requests no longer pay for items leaving their collection one by one.
- A Tabs panel waits only for its own value and its own tab instead of listening to every tab of the collection.
- Prepared (`initial`) mounts share one acceptance gate per bundle, keep no deferred subscriptions after acceptance and build document links on first use; ordinary mounts allocate nothing for them.
