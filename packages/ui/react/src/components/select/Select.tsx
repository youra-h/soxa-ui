import type { ReactElement, ReactNode } from 'react'
import type { ISelectItem, ITags, TDrawnEntry, TDrawnSection, TTagsCollection } from '@soxa-ui/core'
import {
	Elevate,
	hasSlot,
	relaySlot,
	renderSlot,
	roleIcon,
	toAriaProps,
	toControlAttrs,
	toReactStyle,
	toRootForward,
	toRootProps,
} from '../../adapter'
import { Frame } from '../frame'
import { Icon } from '../icon'
import { Input } from '../input'
import { Tags } from '../tags'
import { SelectItem } from './item'
import { SelectGroup } from './group'
import { useSetupSelect } from './setup.component'
import type { SelectAttributes, SelectProps } from './base.component'

/** Стрелка без слота — компонент на роль: `tag` у Icon — корень, а не роль. */
const ArrowIcon = roleIcon('arrowDown')

/**
 * Ряд тегов поля — только в `multiple`. Ключ — инстанс тегов:
 * AGENTS.md (React), «Пересобранный инстанс и `key`».
 */
function drawTags(
	props: SelectProps,
	tags: ITags | null | undefined,
	engine: TTagsCollection | null | undefined,
): ReactNode {
	if (!tags || !engine) return null

	return (
		renderSlot(props.tags, { tags, engine }) ?? (
			<Tags
				key={tags.uid}
				embedded="select.tags"
				className="so-select__tags"
				ctrl={tags}
				engine={engine}
			/>
		)
	)
}

/** Опция из данных со слотами Select или распорка окна на месте пропущенных. */
function drawEntry(props: SelectProps, entry: TDrawnEntry<ISelectItem>): ReactElement {
	if (entry.kind === 'filler') {
		return (
			<div
				key={entry.key}
				className="so-select__filler"
				aria-hidden="true"
				style={toReactStyle(entry.style)}
			/>
		)
	}

	return (
		<SelectItem
			key={entry.key}
			ctrl={entry.item}
			leading={renderSlot(props['item-leading'], { item: entry.item })}
			trailing={renderSlot(props['item-trailing'], { item: entry.item })}
			indicator-icon={relaySlot(props['item-indicator-icon'], { item: entry.item })}
		>
			{relaySlot(props.item, { item: entry.item })}
		</SelectItem>
	)
}

/** Ключи записи (число), группы и разделителя секции не пересекаются. */
function drawSection(
	props: SelectProps,
	section: TDrawnSection<ISelectItem>,
	separated: boolean,
): ReactElement[] {
	const entries = section.entries.map((entry) => drawEntry(props, entry))
	const separator = separated
		? [
				<div
					key={`separator:${section.key}`}
					className="so-select__separator"
					aria-hidden="true"
				/>,
			]
		: []

	if (!section.group) return [...separator, ...entries]

	return [
		...separator,
		<SelectGroup key={section.key} label={section.group.label}>
			{entries}
		</SelectGroup>,
	]
}

/**
 * Select — поле выбора из списка (Combobox, select-only или `editable`): поле и панель со списком.
 * docs/agents/patterns.md, «Готовые паттерны» (Select).
 */
export function Select(props: SelectProps): ReactElement | null {
	const { ref, forwardProps, state, rootElement, field, layer } = useSetupSelect(props)

	const {
		rendered,
		attrs,
		aria,
		dataset,
		size,
		open,
		panelPlacement,
		panelFlip,
		autoFitWidth,
		panelDataset,
		handleRendered,
		contentRendered,
		listAria,
		drawnSections,
		groupSeparators,
		shown,
		tags,
		tags_engine,
		dismiss_ownerAttribute,
		id,
	} = state

	if (!rendered) return null

	return (
		<div {...toRootProps(ref, state, [dataset, attrs], toRootForward(forwardProps))}>
			<Elevate layer={layer}>
				{renderSlot(props.field, { field }) ?? (
					<Input
						key={field.uid}
						embedded="select.field"
						className="so-select__field"
						ctrl={field}
						id={id}
						clear={props.clear}
						leading={
							<>
								{drawTags(props, tags, tags_engine)}
								{renderSlot(props.leading)}
							</>
						}
						trailing={
							<>
								<span className="so-select__arrow">
									{renderSlot(props['arrow-icon']) ?? (
										<Icon embedded="select.arrow" tag={ArrowIcon} size={size} />
									)}
								</span>
								{renderSlot(props.trailing)}
							</>
						}
						{...toAriaProps(aria)}
						{...toControlAttrs<SelectAttributes>(forwardProps)}
					/>
				)}
				<Frame
					ref={state.ids_bindPanel}
					embedded="select.frame"
					className="so-select__panel"
					visible={state.visible && open}
					strategy="fixed"
					anchor_anchor={rootElement}
					anchor_placement={panelPlacement}
					anchor_flip={panelFlip}
					anchor_matchWidth={autoFitWidth}
					anchor_offset={4}
					{...toAriaProps(panelDataset)}
					{...toAriaProps(dismiss_ownerAttribute)}
				>
					{handleRendered ? (
						<div className="so-select__handle" aria-hidden="true" />
					) : null}
					{/* Options from data from the panel's first opening on (`contentRendered`) */}
					<div className="so-select__list" {...toAriaProps(listAria)}>
						{hasSlot(props.children)
							? renderSlot(props.children)
							: contentRendered
								? drawnSections?.flatMap((section, index) =>
										drawSection(
											props,
											section,
											groupSeparators === true && index > 0,
										),
									)
								: null}
						{shown?.length === 0 ? renderSlot(props.empty) : null}
					</div>
				</Frame>
			</Elevate>
		</div>
	)
}
