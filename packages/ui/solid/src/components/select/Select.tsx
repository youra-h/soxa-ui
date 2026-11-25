import type { Accessor, JSX } from 'solid-js'
import type { ISelectItem, TDrawnEntry, TDrawnSection } from '@soxa-ui/core'
import {
	Elevate,
	KeyedFor,
	ResolvedSlot,
	createPartProps,
	createRootProps,
	relaySlot,
	renderSlot,
	roleIcon,
	toControlAttrs,
	toRootForward,
} from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Frame } from '../frame'
import { Icon } from '../icon'
import { Input } from '../input'
import { EmbeddedTags as Tags } from '../tags/embedded'
import { SelectItem } from './item'
import { SelectGroup } from './group'
import { setupSelect } from './setup.component'
import type { SelectAttributes, SelectProps } from './base.component'

/** Стрелка без слота — компонент на роль: `tag` у Icon — корень, а не роль. */
const ARROW = roleIcon('arrowDown')

/** Опция записи; у распорки её нет. */
function itemOf(entry: TDrawnEntry<ISelectItem>): ISelectItem | undefined {
	return entry.kind === 'item' ? entry.item : undefined
}

/** Стиль распорки — высота пропущенных опций; у записи опции его нет. */
function fillerStyleOf(entry: TDrawnEntry<ISelectItem>): JSX.CSSProperties | undefined {
	return entry.kind === 'filler' ? entry.style : undefined
}

/**
 * Поле выбора: `Input` над полем Select (`field`) и панель-Frame со списком. Набор
 * `aria` Select и атрибуты потребителя, кроме класса и стиля, — `<input>` поля:
 * фокус всегда на нём.
 */
export function Select(props: SelectProps): JSX.Element {
	const binding = setupSelect(props)
	const state = binding.state
	const field = binding.field
	const root = createRootProps(() => ({
		state,
		sets: [state.dataset, state.attrs],
		forward: toRootForward(binding.forwardProps()),
	}))
	const control = () => toControlAttrs<SelectAttributes>(binding.forwardProps())
	const listAria = createPartProps(() => state.listAria)

	/** Ряд тегов — только в `multiple`: без него нет ни тегов, ни их движка. */
	const drawTags = () => (
		<Show when={state.tags}>
			{(tags) => (
				<Show when={state.tags_engine}>
					{(engine) => (
						<ResolvedSlot
							content={props.tags}
							scope={() => ({ tags: tags(), engine: engine() })}
							fallback={
								<Tags
									embedded="select.tags"
									class="so-select__tags"
									ctrl={tags()}
									engine={engine()}
								/>
							}
						/>
					)}
				</Show>
			)}
		</Show>
	)

	/** Класс стрелки — на обёртке: по нему тема её поворачивает, а `editable` открывает панель. */
	const drawArrow = () => (
		<span class="so-select__arrow">
			<ResolvedSlot
				content={props['arrow-icon']}
				fallback={<Icon embedded="select.arrow" tag={ARROW} size={state.size} />}
			/>
		</span>
	)

	const drawItem = (item: ISelectItem) => (
		<SelectItem
			ctrl={item}
			leading={renderSlot(props['item-leading'], { item })}
			trailing={renderSlot(props['item-trailing'], { item })}
			indicator-icon={relaySlot(props['item-indicator-icon'], { item })}
		>
			{relaySlot(props.item, { item })}
		</SelectItem>
	)

	/** Запись `drawn`: опция или распорка на месте пропущенных. */
	const drawEntry = (entry: Accessor<TDrawnEntry<ISelectItem>>) => (
		<Show
			when={itemOf(entry())}
			keyed
			fallback={
				<div class="so-select__filler" aria-hidden="true" style={fillerStyleOf(entry())} />
			}
		>
			{drawItem}
		</Show>
	)

	const drawEntries = (section: Accessor<TDrawnSection<ISelectItem>>) => (
		<KeyedFor each={section().entries} by={(entry) => entry.key}>
			{drawEntry}
		</KeyedFor>
	)

	const isFirst = (section: Accessor<TDrawnSection<ISelectItem>>) =>
		state.drawnSections?.[0]?.key === section().key

	const drawSection = (section: Accessor<TDrawnSection<ISelectItem>>) => (
		<>
			<Show when={state.groupSeparators && !isFirst(section)}>
				<div class="so-select__separator" aria-hidden="true" />
			</Show>
			<Show when={section().group} fallback={drawEntries(section)}>
				{(group) => <SelectGroup label={group().label}>{drawEntries(section)}</SelectGroup>}
			</Show>
		</>
	)

	return (
		<Show when={state.rendered}>
			<div {...root()} ref={binding.ref}>
				<Elevate layer={binding.layer}>
					<ResolvedSlot
						content={props.field}
						scope={() => ({ field })}
						fallback={
							<Input
								embedded="select.field"
								class="so-select__field"
								ctrl={field}
								id={state.id}
								clear={props.clear}
								leading={
									<>
										{drawTags()}
										{renderSlot(props.leading)}
									</>
								}
								trailing={
									<>
										{drawArrow()}
										{renderSlot(props.trailing)}
									</>
								}
								{...state.aria}
								{...control()}
							/>
						}
					/>
					<Frame
						onBundleCreate={state.ids_bindPanel}
						embedded="select.frame"
						class="so-select__panel"
						visible={state.visible && state.open}
						strategy="fixed"
						anchor_anchor={binding.rootElement()}
						anchor_placement={state.panelPlacement}
						anchor_flip={state.panelFlip}
						anchor_matchWidth={state.autoFitWidth}
						anchor_offset={4}
						{...state.panelDataset}
						{...state.dismiss_ownerAttribute}
					>
						<Show when={state.handleRendered}>
							<div class="so-select__handle" aria-hidden="true" />
						</Show>
						{/* Options from data from the panel's first opening on (`contentRendered`) */}
						<div class="so-select__list" {...listAria()}>
							<ResolvedSlot
								content={props.children}
								fallback={
									<Show when={state.contentRendered}>
										<KeyedFor
											each={state.drawnSections}
											by={(section) => section.key}
										>
											{drawSection}
										</KeyedFor>
									</Show>
								}
							/>
							<Show when={state.shown?.length === 0}>{renderSlot(props.empty)}</Show>
						</div>
					</Frame>
				</Elevate>
			</div>
		</Show>
	)
}
