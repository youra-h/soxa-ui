import type { IComponentDescriptor, IPluginDefinition } from '@soxa-ui/setup'

/**
 * How the Playground manifest edits a prop.
 *
 * `number-or-text` is the field of a prop typed exactly `Number` and `String`:
 * a typed number goes out as a number, anything else as a string
 * (`parseNumberOrText`). Lengths are declared so (`offset`, `width`,
 * `height`), and for them these are two forms of the value: a number is px, a
 * string is a CSS value (`10%`, `2rem`, `auto`).
 */
export type TControlKind = 'switch' | 'text' | 'number' | 'number-or-text' | 'select' | 'json'

export type TJsonPropParser = (text: string) => { value: unknown } | { error: string }

/**
 * Where a prop lives on its plugin.
 *
 * The name here is the plugin's own, without the namespace: markup calls the
 * prop `anchor_placement`, while the property of `TAnchorPlugin` itself is
 * `placement`.
 */
export type TPluginPropAddress = {
	/** The plugin's key in the bundle: `bundle.get(ctor)`. */
	ctor: IPluginDefinition['ctor']
	/** The property on the plugin: the prop name from the declaration. */
	name: string
}

/**
 * Who owns the prop.
 *
 * As a prop it is set the same way: the Vue component merges all the sets.
 * Through the instance it differs: a component property is written to the
 * instance itself, a collection property to the facade the playground builds
 * over its own engine, a plugin property to the plugin from the bundle the
 * adapter hands out with the `bundle:create` event. So only a plugin row has
 * a plugin address.
 */
export type TPropOwner =
	| { scope: 'component' }
	| { scope: 'collection' }
	| { scope: 'plugin'; plugin: TPluginPropAddress }

export type TPropControl = TPropOwner & {
	/**
	 * The name markup writes the prop with (`underscorePropNaming`). A plugin
	 * prop carries the namespace, `anchor_placement`; for the rest it matches the
	 * declared name.
	 */
	name: string
	kind: TControlKind
	parseJson?: TJsonPropParser
	/** Options for `select`; empty for the rest. */
	options?: readonly string[]
	/**
	 * Values of `select` options when they are not strings: option name → value
	 * for the component (the `formatOptions` presets of the number field).
	 * Missing: an option's value is its name.
	 */
	values?: Readonly<Record<string, unknown>>
	description: string
	notice?: string
	sourceTitle?: string
	/**
	 * The default from the prop spec (`TPropSpec.default`).
	 *
	 * The key matters, not the value: a declared default can be `undefined`
	 * (`closable` of a Tabs or Tags item). No key: the prop has no default.
	 */
	default?: unknown
	/**
	 * The value a row opens with. An editor can override the shared `PREVIEW_PROPS`
	 * for its own example. The field and both columns open with this value.
	 * Clearing the field gives the instance the descriptor default.
	 *
	 * The key matters, as with `default`: no key means the preview does not set
	 * this prop, and the row opens with the default.
	 */
	initial?: unknown
	/**
	 * Sibling props without which this one is not visible (`removeOnBackspace`
	 * needs `editable` and `multiple`). The row's preview gets them along with
	 * the prop itself.
	 */
	preset?: Record<string, unknown>
}

/**
 * Rows of a component page, split by the prop's owner: `componentControls`,
 * `collectionControls`, `pluginControls`.
 *
 * Groups rather than one list: that is how the library itself is built, and
 * through the instance each owner's prop is written its own way (see
 * `TPropOwner`). Keys are derived from `scope` so a new owner cannot be left
 * without a group; the suffix is there because the project has no field named
 * bare `collection` (AGENTS.md, «Переменная — `engine`, а не `collection`»).
 */
export type TPropControlGroups = {
	[TScope in TPropOwner['scope'] as `${TScope}Controls`]: TPropControl[]
}

/**
 * A registry entry's group: a section of the props page menu. The order of
 * groups in the menu and their labels are `COMPONENT_GROUPS` in the registry.
 */
export type TComponentGroup =
	'forms' | 'dates' | 'overlays' | 'collections' | 'display' | 'utilities' | 'layers'

export type TComponentEntry = {
	/** Key in the route, after the framework: `/vue/button`. */
	id: string
	/** Label in the menu and the heading. */
	label: string
	/** Descriptor factory: the source of props, events and slots. */
	descriptor: () => IComponentDescriptor
	/**
	 * Descriptor of the collection facade, for components that have one.
	 *
	 * Separate rather than merged into the component's, because that is how the
	 * library is built: the core owns the component's properties, not the
	 * collection's. `mode` lives on the facade, and the Vue component merges the
	 * two descriptors into one prop set; the playground does the same.
	 */
	collectionDescriptor?: () => IComponentDescriptor
	/**
	 * Parts the preview places in markup, by export name (`Item` of
	 * `Tabs.Item`): the descriptors whose events the part sends — its own and
	 * its collection facade's, as the adapters declare them. A host listens to
	 * them as to the component itself (`partsOf`). Parts the owner draws from
	 * `items` (Tags, Pagination) are not here: the consumer has no hold on
	 * them.
	 */
	parts?: Readonly<Record<string, () => readonly IComponentDescriptor[]>>
	/**
	 * Menu group. `layers` holds inheritance layers such as `Control` or
	 * `Stylable`: they have a page but are not on the showcase, being levels of
	 * the contract rather than components.
	 */
	group: TComponentGroup
	/** Width of the showcase cell, in grid columns. */
	span: 1 | 2
	/** A short line under the page heading. */
	description: string
}

export type TThemeEntry = {
	id: string
	label: string
	/** The `data-so-theme` value of the light scheme; the dark one is `${value}-dark`. */
	value: string
}

export type TIconPackEntry = {
	id: string
	label: string
}
