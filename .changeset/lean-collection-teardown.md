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

Faster Tabs and Tags on large collections, especially declarative items: mounting 1000 markup items is 2–4 times faster in every adapter and on the server.

- A collection item's `change:order` is emitted only when its own position changed; appending an item no longer notifies every sibling. Item order is memoized per storage write instead of copying the collection on every read.
- Activation and selection update `data-selected` only on the items whose state changed.
- The active tab indicator is measured at most once a frame. Unmounting 1000 declarative tabs in Solid took over 20 seconds and now takes about 0.2 seconds.
- Angular detaches every binding when the application starts tearing down, so server requests no longer pay for items leaving their collection one by one. Angular, Solid, Svelte and Web Components stop listening to the state on `detach`.
- Prepared (`initial`) mounts share one acceptance gate per bundle instead of copying every plugin definition per item.
