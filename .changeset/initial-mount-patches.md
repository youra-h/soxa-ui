---
'@soxa-ui/core': minor
'@soxa-ui/plugins': minor
'@soxa-ui/setup': minor
'@soxa-ui/angular': patch
'@soxa-ui/solid': patch
'@soxa-ui/svelte': patch
'@soxa-ui/vue': patch
'@soxa-ui/webc': patch
---

Prepared (`initial`) Tabs and Tags keep their mount-local ARIA only until the framework accepts the mount, then write tab links and close button names into the item models as an ordinary mount does. On the client, Vue, Solid, Svelte, Angular and Web Components read the state directly: 1000 prepared tabs now hold 0.3–0.4 MiB more than the `items` path instead of 1.2–1.9 MiB (React: 1.1 MiB instead of 1.6 MiB). Every component with localized button names also stops keeping an unused listener set per mount.

Breaking for code that wires prepared mounts by hand (components, props, events, classes and `data-*` are unchanged):

- `getSnapshot()` and `subscribe()` are removed from `TNamesPlugin` and its subclasses, from `TTabsItemIdsPlugin` and from `TTabsContentBindingExtension`; `TTabsItemIdsPlugin.initial` and `TCollectionInitialPartPlugin.aria` are removed too. Before acceptance these values are in the mount's patches: read `TPluginMount.patches` (new, with `TPluginMount.patch()`); after acceptance read the item model (`aria`, `closeAria`).
- `TCollectionAriaState` now takes `(state, mount)` instead of an options object, and the `ICollectionAriaLink` and `ICollectionAriaStateOptions` types are removed. Use `collectionInitialState(context, state)`, which returns the plain state once the mount is accepted.

Consumer upgrade instructions: docs/upgrade/0.5.0.md.

Also update custom collection integrations: replace preparation owner accept/release and transactions.rollbackOwner with the returned transaction handle; call prepare(options) and transactions.begin(options) without item/owner, use ICollectionTransactionOptions instead of removed IPreparationOptions, drop the ICollectionTransactions type parameter, and provide readonly revision in custom drivers. Replace removed IPluginMountOptions with the relevant context type; TPluginMount.defer now returns void. collectionInitialOwnerOptions no longer takes a descriptor, and custom TItemGroupPart implementations must provide visible.
