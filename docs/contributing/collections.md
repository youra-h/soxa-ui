# Collections and compound parts

Read [collection rules](../agents/collections.md) before changing an engine,
facade or item. Collections exist in all six adapters at this baseline.
The old claim that collections are Vue-only is obsolete.

## Keep three layers separate

The visual core model holds its own values. The engine holds collection mechanisms
and extensions. A facade projects extensions into public component state. The
shared setup collection extension wires these layers to mounts. A visual model
does not acquire an engine merely to reach siblings.

Follow [Tabs' composition](../../packages/core/src/components/custom/tabs/collection/factory.ts)
and [descriptors](../../packages/setup/content/descriptors/components/tabs/collection.descriptor.ts).
Compose existing base, activation or selection sets. Reusable collection mechanisms
belong in the engine; setup extensions wire lifecycle. Only collection extensions
access the driver. Change/cancel operations through existing before-events.
Item-dependent logic belongs in the item adapter, not a scan on `item:added`.

Facades inherit the base matching their extension set. Derive relayed event maps
from sources and relay them whole. Prefix facade props where merged with visual
state. Forward an external engine and preserve its ownership.

## Wire mounts

Owner and facade use two contexts sharing the owner's bundle. Items mirror this
with an item facade and the shared item extension. Bind the facade before the
visual component where required by the runtime. Use each adapter's collection
helper; do not translate Vue's setup timing literally to React. An item joins at
its framework's accepted mount, not merely at context assembly. A discarded
render cannot join a live collection. A mount's item context is released on
unmount, while external items/engines can survive.

Check model-created and markup-created items, arbitrary user wrappers, ordering,
removal of active/selected items, disabled propagation and remounts. Activation
and selection stay distinct. Check collection links in server markup and hydration.

## Own instance or markup?

Inspect [Select's anatomy](../../.github/skills/add-soxa-component/references/complex-component.md).
A part needs an instance when it owns core state, plugins or collection behavior.
An icon or close action can be markup or an embedded existing component. Do not
create another model only to obtain classes.

Public compound API uses `Owner.Part` as its primary form with deliberate exports.
Parts with instances keep their classes. Mark embedded children with the correct
`embedded` key. Optional absent parts must not mount listeners/plugins. Use static
slot names with typed scope, not a new slot name per item.

For overlays, read [overlay rules](../agents/overlay.md) and reuse shared layers,
anchors, dismissal, focus return, gestures and scroll lock. For date controls,
read [date rules](../agents/dates.md); reuse calendar logic and locale rather than
adding an adapter-specific date representation.
