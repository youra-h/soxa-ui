# Add application behavior in 0.4.2

Use public package roots. A plugin adds behavior to the component's existing
bundle; it does not replace that bundle or modify its built-in plugins.
The attached text-audit plugin emits a record when a Button controller's text
changes. Its event types are separate from its implementation. It extends
`TBasePlugin` and subscribes to the owner's bus through `_listenTo`, whose
subscriptions the base removes in `destroy()`. If you override destroy, release
your own resources and call `super.destroy()`.

Call `definePlugin` once beside the class. It records the namespace, props,
triggers and explicitly public events. The sample declares `audit_prefix` with
a class default of `audit`, and the `record` event. `usePlugins(TButton,
[TTextAuditPlugin])` registers it before components mount. The returned function
removes the registration for future mounts; existing mounts retain their plugins
until teardown. Default scope is `own`: embedded library Buttons are excluded.
Use `{ scope: 'all' }` only when you intend to affect those details too; themes
use that scope by default.

For one instance, subscribe to its `bundle:create`, narrow the bundle, and call
`bundle.use(TTextAuditPlugin)` instead of registering globally. The sample
retrieves its installed plugin there. Install by one of these routes; do not
replace a class already included by the component descriptor. Assembly creates
the bundle; do not pass a manually constructed bundle to an adapter component.

The generic component prop is `pluginProps`. In Vue this example uses
`:plugin-props="{ audit_prefix: prefix }"`. External props do not become new
flat component props such as `audit_prefix`. Add known keys to
`IExternalPluginProps` through module augmentation of setup. Omit a previously
set key to reset it to its declaration default; the example tests updates and
reset. A prop bag does not install the plugin. A plugin with no `definePlugin`
contract receives neither this transport nor exported events.

Only declared public plugin events go through `plugin:event`, whose envelope is
`{ name: 'audit:record', args: [record] }`. The same envelope reaches
`ctrl.events.on('plugin:event', handler)`. Narrow payloads before reading them.
The attached app uses this controller channel; its final audit component also
shows the Vue event channel. Other framework transport names and payload rules
come from the related generated Button API records. Built-in plugin props such
as `aria_label` remain direct props rather than entries in pluginProps. Internal
install/create/destroy events are not component events.

Collection behavior has a separate public route: `useExtensions` registers
factories for a core owner type, or `engine:create` lets you call the public
engine's `use` method for one collection. Follow that extension's published
contract. This recipe validates an application plugin, not a new collection
extension, and never requires imports into setup's internal directories.
