/**
 * Element base: a built-in element of a tag, extended by the component's class
 * (customized built-in). `<button is="so-button">` is a real button, and its
 * form, `<label>`, focus and accessibility are native. The factory
 * `ElementBase(HTMLButtonElement, spec)` builds the class over the tag's native
 * class: one base, a native class per tag.
 *
 * The template structure and the light are built once, on the first
 * connection. Each connection is a new binding over the same instance and a
 * full paint; a disconnection drops the binding. A first connection that comes
 * too early goes to the deferral queue, one inside another's connection waits
 * for it. Updates are targeted: names of changed props gather until a
 * microtask, and the flush applies only their bindings. AGENTS.md (Web
 * Components), «База элемента».
 */

// First: an element class extends the native class of its tag, and Safari
// extends built-ins only with the polyfill, which replaces those classes. Every
// entry of the package reaches it here or through the registration, before the
// first class of an element. Where the browser supports them, it does nothing
import '@ungap/custom-elements'
import type { IComponent, IComponentProps } from '@soxa-ui/core'
import {
	TSurface,
	type DescriptorComponentProps,
	type IComponentDescriptor,
	type TStateSnapshot,
} from '@soxa-ui/setup'
import {
	buildAttributeMap,
	coerceAttribute,
	isHostProp,
	toAttributeName,
	type IAttributeBinding,
	type THostProp,
	WebcProfile,
} from '../common'
import type { ITemplate, ITemplateContext, TTemplateParts } from '../template'
import { TDeferral } from './deferral'
import { isUnderUpgrade, isUpgradedOnRegistration } from './defineElement'
import { TLight } from './light'
import { markPlaceOwner } from './marks'
import { TElementAttributes, TPaint, classesOf, orderOf, setOf, stylesOf } from './paint'
import { TPropStore } from './props'
import { NATIVE_INPUT } from './native-input'
import { keepsBinding } from './relocation'
import { placeOf, planOf, presenceOf, type TRootSpec } from './root'
import { TSubtree, followAbove, provideSubtree, type TAbove } from './subtree'
import { TTeleport } from './teleport'
import type { TBinding, TBindingState, TUpdateListener } from './useAdapter'
import { connecting, isConnecting, wait } from './waiting'

/**
 * The `id` attribute is a prop of `TIdPlugin`. On a root with a field it is the
 * field's prop, not an input of the root: two nodes with one `id` would break
 * `<label for>`. A root without a field carries the `id` itself (a tab panel),
 * and there the attribute is an input.
 */
const ID = 'id'

/** `id` from the attribute: an empty one removes the prop, like a native `id`. */
function idOf(raw: string | null): string | undefined {
	return raw === null || raw === '' ? undefined : raw
}

/** An own prop wins over a facade prop of the same name: both bindings get the delta. */
function attributesOf(
	descriptors: readonly IComponentDescriptor[],
): Map<string, IAttributeBinding> {
	const map = new Map<string, IAttributeBinding>()

	for (const descriptor of descriptors) {
		for (const [name, binding] of buildAttributeMap(descriptor)) {
			if (!map.has(name)) map.set(name, binding)
		}
	}

	return map
}

/** The root spec names a node the template didn't build: nowhere to carry it. */
function built(node: HTMLElement | undefined, what: string): HTMLElement {
	if (!node) throw new Error(`[soxa] Описание корня объявляет ${what}, а шаблон его не построил`)

	return node
}

export interface IElementBase<TInstance, TFacade = unknown, TOwnerFacade = unknown> {
	readonly state: TBindingState<TInstance, TFacade, unknown, TOwnerFacade>
	/** The next assembly gets the instance of the first one: a move doesn't replace `el.ctrl`. */
	ctrl: TInstance | undefined
	connectedCallback(): void
	disconnectedCallback(): void
	attributeChangedCallback(name: string, old: string | null, value: string | null): void
}

/**
 * Prop properties on the prototype: the descriptor's contract, like React and
 * Solid props, minus what the element has by its tag, `HOST_PROPS` and `ctrl`.
 */
export type TElementProps<
	TDescriptorFn extends (...args: any[]) => IComponentDescriptor,
	TNative extends HTMLElement,
> = Omit<DescriptorComponentProps<TDescriptorFn>, keyof TNative | THostProp | 'ctrl'>

export type TDescriptorFactory = () => IComponentDescriptor

/** Own attributes as properties: the value is the attribute, `null` without it; `undefined` and `null` remove it. */
export type TOwnAttributes<TOwn extends string> = { [K in TOwn]: string | null | undefined }

/** Element type: the tag's native element, the base's members, prop and own attribute properties. */
export type TElementOf<
	TNative extends HTMLElement,
	TDescriptor extends TDescriptorFactory,
	TInstance,
	TFacade = unknown,
	TOwnerFacade = unknown,
	TOwn extends string = never,
> = TNative &
	IElementBase<TInstance, TFacade, TOwnerFacade> &
	TElementProps<TDescriptor, TNative> &
	TOwnAttributes<TOwn>

/** `TOutputs` are the outputs of the descriptor's plugins: the template reads them typed in the state. */
export interface IElementSpec<
	TInstance,
	TFacade = unknown,
	TOutputs = unknown,
	TOwnerFacade = unknown,
	TDescriptor extends TDescriptorFactory = TDescriptorFactory,
	TOwn extends string = never,
> {
	readonly descriptor: TDescriptor
	/** Descriptor of the collection facade: its props are inputs of the element too. */
	readonly facade?: TDescriptorFactory
	/** Descriptor of the facade of its own collection, on an item with a submenu. */
	readonly ownerFacade?: TDescriptorFactory
	readonly template: ITemplate<TInstance, TFacade, TOutputs, TOwnerFacade>
	readonly root?: TRootSpec
	/** Own attributes beyond props (`icon`): the attribute holds the value, the property reflects it. */
	readonly attributes?: readonly TOwn[]
	setup(
		host: HTMLElement,
		ctrl: TInstance | undefined,
		props: Record<string, unknown>,
		onUpdate: TUpdateListener,
	): TBinding<TInstance, TFacade, TOutputs, TOwnerFacade>
}

/** Rest `any[]` is the mixin constructor shape: without it the base class doesn't combine with the native one. */
export type TNativeElementClass = new (...args: any[]) => HTMLElement

/**
 * `instanceof` with the class narrows a node to the element with its full
 * type, by the predicate of `[Symbol.hasInstance]` (TypeScript 5.3+): the base
 * sets the prop properties on the prototype at run time, and the instance type
 * of the class doesn't know them. `prototype` and the constructor stay native:
 * typed as the element, they would not hold for the class the base builds
 * without a cast.
 */
export type TElementClass<
	TInstance,
	TFacade = unknown,
	TOwnerFacade = unknown,
	TElement = IElementBase<TInstance, TFacade, TOwnerFacade>,
> = (new (...args: any[]) => IElementBase<TInstance, TFacade, TOwnerFacade>) & {
	readonly observedAttributes: string[]
	[Symbol.hasInstance](node: unknown): node is TElement
}

/**
 * Element class by the tag's native class and the descriptor. The annotation of
 * an element export: the declaration names the descriptor (`typeof
 * ButtonDescriptor`) instead of spelling out the inferred type.
 */
export type TElementClassOf<
	TNative extends TNativeElementClass,
	TDescriptor extends TDescriptorFactory,
	TInstance,
	TFacade = unknown,
	TOwnerFacade = unknown,
	TOwn extends string = never,
> = TNative &
	TElementClass<
		TInstance,
		TFacade,
		TOwnerFacade,
		TElementOf<InstanceType<TNative>, TDescriptor, TInstance, TFacade, TOwnerFacade, TOwn>
	>

/** Element type of a class: `TElementType<typeof TButtonElement>`. */
export type TElementType<TClass> = TClass extends {
	[Symbol.hasInstance](node: unknown): node is infer T
}
	? T
	: never

/**
 * The result type is declared: TypeScript doesn't emit a class inferred from an
 * expression into a declaration, it has private members.
 */
export function ElementBase<
	TNative extends TNativeElementClass,
	TInstance extends IComponent<IComponentProps, any>,
	TFacade = unknown,
	TOutputs = unknown,
	TOwnerFacade = unknown,
	TDescriptor extends TDescriptorFactory = TDescriptorFactory,
	TOwn extends string = never,
>(
	Native: TNative,
	spec: IElementSpec<TInstance, TFacade, TOutputs, TOwnerFacade, TDescriptor, TOwn>,
): TElementClassOf<TNative, TDescriptor, TInstance, TFacade, TOwnerFacade, TOwn> {
	const descriptors = [spec.descriptor(), spec.facade?.(), spec.ownerFacade?.()].filter(
		(descriptor): descriptor is IComponentDescriptor => descriptor !== undefined,
	)
	const plan = planOf(spec.root)
	const attributes = attributesOf(descriptors)

	if (plan.fieldId && !attributes.has(ID)) {
		throw new Error('[soxa] Описание корня объявляет id поля, а у дескриптора пропа id нет')
	}

	// The field's `id` is not an input of the root and is not in the prop map:
	// the base takes the attribute as the prop and removes it from the root, on
	// build and on every write from code. As an input, the removal would reset
	// the prop to its default
	const fieldId = (plan.control || plan.fieldId) && attributes.has(ID)

	if (fieldId) attributes.delete(ID)

	/** Prop inputs on the root: their value in the core's set is always right. A wrapper has none. */
	const inputs: ReadonlySet<string> = new Set(plan.wrapped ? [] : attributes.keys())
	/** Own attributes: attribute name → property name. */
	const own: ReadonlyMap<string, string> = new Map(
		(spec.attributes ?? []).map((name) => [toAttributeName(name), name]),
	)

	class TElementBase extends Native implements IElementBase<TInstance, TFacade, TOwnerFacade> {
		static get observedAttributes(): string[] {
			return [...attributes.keys(), ...own.keys(), ...(fieldId ? [ID] : [])]
		}

		/**
		 * The inherited check, typed with the element: through `super`, since
		 * `instanceof` the class itself would call this method again. The
		 * polyfill leaves `Symbol.hasInstance` of the native classes alone.
		 */
		static [Symbol.hasInstance](
			node: unknown,
		): node is TElementOf<
			InstanceType<TNative>,
			TDescriptor,
			TInstance,
			TFacade,
			TOwnerFacade,
			TOwn
		> {
			return super[Symbol.hasInstance](node)
		}

		private _binding?: TBinding<TInstance, TFacade, TOutputs, TOwnerFacade>
		private _ctrl?: TInstance
		private readonly _props = new TPropStore()
		private readonly _light = new TLight(this)
		private readonly _dirty = new Set<string>()
		private _flushQueued = false
		private _connected = false
		/** In the deferral queue or waiting for another element's connection. */
		private _deferred = false

		/** The node that gets what the core writes and goes to `TElementPlugin`. */
		private _root: HTMLElement = this
		/** The outer node: hiding goes on it. */
		private _outer: HTMLElement = this
		private _companion: HTMLElement | null = null
		private _teleport?: TTeleport
		/** The root is in its place: a layer's root is in the target or in place. */
		private _placed = true

		/** Own subtree flag, one for the whole lifetime. */
		private readonly _subtree = new TSubtree()
		/** The ancestor's flag, for this assembly. */
		private _above?: TAbove

		private readonly _view: ITemplateContext<TInstance, TFacade, TOutputs, TOwnerFacade> =
			this._viewOf()

		constructor(...args: ConstructorParameters<TNativeElementClass>) {
			super(...args)
			markPlaceOwner(this)
			// The flag goes to the place on creation, before anything under the element assembles
			provideSubtree(this, this._subtree)

			// The owner builds a detail before its assembly: the owner's set waits for the field
			if (plan.control) TElementAttributes.of(this).awaitField()
		}

		get state(): TBindingState<TInstance, TFacade, unknown, TOwnerFacade> {
			return this._binding?.state ?? {}
		}

		get ctrl(): TInstance | undefined {
			return this._binding?.ctrl ?? this._ctrl
		}

		set ctrl(value: TInstance | undefined) {
			this._ctrl = value
		}

		connectedCallback(): void {
			// A callback of a node removed before its turn
			if (!this.isConnected) return

			// A live binding: a move made by the base
			if (this._connected || this._deferred) return

			const deferral = this._light.built ? undefined : this._deferralOf()

			if (deferral) {
				this._deferred = true
				deferral.defer(this, this._resume)

				return
			}

			if (isConnecting()) {
				this._deferred = true
				wait(this._resume)

				return
			}

			connecting(() => this._connect())
		}

		disconnectedCallback(): void {
			if (keepsBinding(this)) return

			this._connected = false
			this._above?.stop()
			this._above = undefined
			this._binding?.detach()
			this._binding?.destroy()
			this._binding = undefined
			this._teleport?.release()

			// Off the page: the place's panels leave at once; moved: they return on connection
			if (!this.isConnected) TTeleport.recall(this)
		}

		attributeChangedCallback(name: string, old: string | null, value: string | null): void {
			if (
				value === null &&
				old !== null &&
				TElementAttributes.consumeInputRemoval(this, name, old)
			)
				return

			// The customized-built-in polyfill delivers callbacks later. A newer
			// attribute value supersedes an older reflected notification.
			if (this.getAttribute(name) !== value) return

			// The field's `id` written from code (`el.id`, `setAttribute`) goes to the
			// field, like a markup attribute. The removal from the root is the base's
			// own, and the base skips it
			if (fieldId && name === ID) {
				if (value !== null) this._takeFieldId()

				return
			}

			// A root without a field carries the `id` itself: the attribute is both an
			// input of `TIdPlugin` and the place where the base puts the `id` of the
			// core's set (a tab panel without its own: the tab's formula) or the
			// template does (a date field: its own). The base tells its own painting
			// from an input by value: the callback comes in the middle of it too, and
			// after it with the polyfill. An empty one removes the prop, as on a field
			if (name === ID && attributes.has(ID)) {
				if (value === null || TElementAttributes.of(this).wanted(name) !== value) {
					this._write(ID, idOf(value))
				}

				return
			}

			const attribute = attributes.get(name)

			if (attribute) {
				// Core reflection is output, not a new consumer input. Feeding it back
				// would cache inherited disabled as a prop and lose a later reset.
				if (value !== null && value === TElementAttributes.of(this).wanted(name)) return

				// A removed attribute resets the prop to its default too.
				this._write(attribute.prop, coerceAttribute(value, attribute))

				return
			}

			const property = own.get(name)

			if (property !== undefined) this._mark(property)
		}

		private readonly _resume = (): void => {
			this._deferred = false

			if (this.isConnected) this.connectedCallback()
		}

		/** A parsing document wins; under a waiting element, its queue; upgraded on registration, the registration's. */
		private _deferralOf(): TDeferral | undefined {
			const owner = this.ownerDocument

			if (owner.readyState === 'loading') return TDeferral.parsing(owner)

			return (
				TDeferral.above(this) ??
				(isUpgradedOnRegistration(this) || isUnderUpgrade(this)
					? TDeferral.registration
					: undefined)
			)
		}

		private _connect(): void {
			const again = this._light.built

			this._connected = true

			if (!again) {
				this._readAttributes()
				this._build()
			}

			this._assemble()
			this._above = followAbove(this, this._onAbove)

			// The place's panels go back to their anchors and assemble next, with the new elevator
			if (again) TTeleport.recall(this)

			// The first paint gives the node to plugins, already by the ancestor's flag
			this._flush(true)
		}

		private readonly _onAbove = (): void => {
			this._hide(this.state)
		}

		/** With the polyfill, attribute callbacks come after the connection: the base doesn't wait for them. */
		private _readAttributes(): void {
			for (const [name, attribute] of attributes) {
				if (this._props.isGiven(attribute.prop) || !this.hasAttribute(name)) continue

				const raw = this.getAttribute(name)

				this._write(
					attribute.prop,
					name === ID ? idOf(raw) : coerceAttribute(raw, attribute),
				)
			}
		}

		[NATIVE_INPUT](name: string, value: unknown): void {
			if (attributes.get(toAttributeName(name))?.prop !== name || !(name in Native.prototype))
				return

			this._write(name, value)
		}

		private _write(name: string, value: unknown): void {
			this._props.write(name, value, this._binding)
		}

		private _assemble(): void {
			const props = this._props.open(this._root.localName)
			const binding = spec.setup(this, this._ctrl, props, this._onUpdate)

			this._binding = binding
			this._ctrl = binding.ctrl
			this._props.close(binding)
		}

		private _build(): void {
			const groups = this._light.gather()
			const parts = spec.template.create(this, this._view)

			if (fieldId) this._takeFieldId()
			if (plan.wrapped) this._root = built(parts.root, 'обёртку')

			const field = this._receiverOf(parts)

			if (field) {
				this._handOver(field)

				// After the markup's statics: they win over the owner's set
				if (plan.control) TElementAttributes.of(this).bindField(field)
			}

			if (plan.outerIsRoot) this._outer = this._root

			this._teleport = this._teleportOf(parts.companion)
			this._light.distribute(groups, parts.slots)
		}

		/** Who gets the markup's statics: the root's field or the root inside the wrapper. */
		private _receiverOf(parts: TTemplateParts): HTMLElement | undefined {
			if (plan.wrapped) return this._root
			if (plan.control) return built(parts.control, 'поле')

			return undefined
		}

		/** The field's `id` goes from the root to the prop; an empty one removes it, like a native `id`. */
		private _takeFieldId(): void {
			const id = this.getAttribute(ID)

			if (id === null) return

			this._write(ID, idOf(id))
			this.removeAttribute(ID)
		}

		/** The removal calls no callbacks: the element observes none of these attributes. */
		private _handOver(target: HTMLElement): void {
			for (const name of this.getAttributeNames()) {
				if (plan.keep.has(name) || attributes.has(name) || own.has(name)) continue

				target.setAttribute(name, this.getAttribute(name) ?? '')
				this.removeAttribute(name)
			}
		}

		private _teleportOf(companion: HTMLElement | undefined): TTeleport | undefined {
			if (plan.layer === undefined) {
				if (companion) {
					throw new Error(
						'[soxa] Шаблон построил спутник корня, а описание корня слоя не объявляет',
					)
				}

				return undefined
			}

			this._companion = companion ?? null

			return new TTeleport(this, this._root, this._companion)
		}

		private readonly _onUpdate: TUpdateListener = (name, value) => {
			this._props.remember(name, value)
			this._mark(name)
		}

		/** No flush without a connection: the name waits for the full paint of the next one. */
		private _mark(name: string): void {
			this._dirty.add(name)
			this._queueFlush()
		}

		private _queueFlush(): void {
			if (this._flushQueued || !this._connected) return

			this._flushQueued = true

			queueMicrotask(() => {
				this._flushQueued = false

				if (this._connected) this._flush()
			})
		}

		private _viewOf(): ITemplateContext<TInstance, TFacade, TOutputs, TOwnerFacade> {
			const light = this._light
			const state = (): TBindingState<TInstance, TFacade, TOutputs, TOwnerFacade> =>
				this._binding?.state ?? {}
			const instance = (): TInstance | undefined => this.ctrl
			const facade = (): TFacade | undefined => this._binding?.facade

			return {
				root: this,
				get content() {
					return light.content
				},
				get state() {
					return state()
				},
				get ctrl() {
					return instance()
				},
				get facade() {
					return facade()
				},
				hasSlot: (name) => light.has(name),
				slotted: (name) => light.slotted(name),
				showSlot: (name, shown) => light.show(name, shown),
				sample: (name) => light.sample(name),
			}
		}

		private _flush(full = false): void {
			// State by names: a non-visual component has neither classes nor sets
			const state: TStateSnapshot = this.state
			const paint = TPaint.of(this._root)
			// Names before painting: a change during it waits for its own flush
			const dirty = new Set(this._dirty)
			const changed = (name: string) => full || dirty.has(name)

			this._dirty.clear()

			if (changed('classes')) paint.classes('own', classesOf(state['classes']))

			for (const [layer, output] of plan.sets) {
				if (changed(output)) {
					TElementAttributes.of(this._root).set(layer, setOf(state[output]), inputs)
				}
			}

			if (
				changed('layout_styles') ||
				(plan.style !== undefined && changed(plan.style)) ||
				(plan.order && changed('order'))
			) {
				paint.styles(
					'own',
					stylesOf(
						state['layout_styles'],
						plan.style === undefined ? undefined : state[plan.style],
						plan.order ? orderOf(state['order']) : undefined,
					),
				)
			}

			const layer = plan.layer
			const teleport = this._teleport
			const placing =
				layer !== undefined &&
				teleport !== undefined &&
				(full ||
					changed(layer.target) ||
					(layer.contained !== undefined && changed(layer.contained)))

			if (placing) this._placed = teleport.place(placeOf(state, layer))

			// Hiding and the own flag before the bindings: what they insert assembles under the new ones
			if (
				changed('rendered') ||
				changed('visible') ||
				placing ||
				(plan.shownBy !== undefined && changed(plan.shownBy))
			) {
				this._hide(state)
			}

			for (const binding of spec.template.bindings) {
				if (full || binding.props.some(changed)) binding.apply(this._view)
			}
		}

		/** Hiding, the node for plugins and the own flag; the node goes on every call, the plugin skips the same one. */
		private _hide(state: TStateSnapshot): void {
			const { hidden, present, subtree } = presenceOf(
				plan,
				state,
				this._above?.present ?? true,
				this._placed,
			)

			TPaint.of(this._outer).hidden(hidden)

			if (this._companion) TPaint.of(this._companion).hidden(hidden)

			this._binding?.bindElement(present ? this._root : null)
			this._subtree.present = subtree
		}

		/**
		 * Prop properties of all descriptors, except `ctrl`, `HOST_PROPS` and the
		 * tag's properties: a button's `disabled` stays native and reaches the core
		 * as an attribute. Then the properties of own attributes; a taken name is an
		 * error of the spec.
		 */
		static {
			const props = new Set(
				descriptors.flatMap((descriptor) =>
					Object.keys(TSurface.of(descriptor, WebcProfile).exportProps),
				),
			)

			for (const prop of props) {
				if (prop === 'ctrl' || isHostProp(prop) || prop in Native.prototype) continue

				Object.defineProperty(this.prototype, prop, {
					configurable: true,
					enumerable: true,

					get(this: TElementBase) {
						return this._props.read(prop, this._binding)
					},

					set(this: TElementBase, value: unknown) {
						this._write(prop, value)
					},
				})
			}

			for (const [attribute, property] of own) {
				if (
					attributes.has(attribute) ||
					isHostProp(property) ||
					property in this.prototype
				) {
					throw new Error(
						`[soxa] Свой атрибут «${attribute}» занят: это имя уже у пропа, класса элемента или нативного элемента`,
					)
				}

				Object.defineProperty(this.prototype, property, {
					configurable: true,
					enumerable: true,

					get(this: TElementBase): string | null {
						return this.getAttribute(attribute)
					},

					set(this: TElementBase, value: unknown) {
						if (value === null || value === undefined) {
							this.removeAttribute(attribute)
						} else {
							this.setAttribute(attribute, String(value))
						}
					},
				})
			}
		}
	}

	return TElementBase
}
