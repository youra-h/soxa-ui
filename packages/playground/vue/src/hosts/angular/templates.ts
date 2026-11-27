import {
	ChangeDetectionStrategy,
	Component,
	Directive,
	input,
	linkedSignal,
	viewChild,
	viewChildren,
} from '@angular/core'
import type { IToastsItem, TToastsItemType } from '@soxa-ui/core'
import {
	AttributesDirective,
	SlotDirective,
	TAccordionComponent,
	TAccordionItemComponent,
	TButtonComponent,
	TCalendarComponent,
	TDialogComponent,
	TGuideComponent,
	TAlertDialogComponent,
	TDragAndDropComponent,
	TDrawerComponent,
	TInputComponent,
	TListBoxComponent,
	TMenuCheckboxItemComponent,
	TMenuComponent,
	TMenuGroupComponent,
	TMenuItemComponent,
	TMenuPopoverItemComponent,
	TMenuRadioGroupComponent,
	TMenuRadioItemComponent,
	TMenuSeparatorComponent,
	TMenuSubmenuComponent,
	TPopoverComponent,
	TSelectComponent,
	TTableComponent,
	TTabsComponent,
	TTabsContentComponent,
	TTabsItemComponent,
	TToastsComponent,
	TTooltipComponent,
	TVirtualComponent,
	useToasts,
	type TToastRender,
} from '@soxa-ui/angular'
import {
	COLLECTION_ITEMS,
	COLLECTION_MANY_ITEMS,
	TABLE_COLUMNS,
	TABLE_MANY_ROWS,
	TOASTS_ITEM_TYPES,
	TOAST_SAVING,
	toastSample,
} from '@soxa-ui/playground-shared'
import { CopyDirective } from './copy.directive'
import { PartDirective } from './part.directive'
import type { TFixture } from './fixtures'

/**
 * Previews whose markup needs slot templates, state of their own or a
 * directive, in Angular.
 *
 * The trigger of Popover and Tooltip is a slot template with a scope
 * (`<ng-template slot="trigger">`). Dialog and Drawer need a button that opens
 * them, an open state of their own and parts by slots, as in the Vue preview.
 * A component without a root (Virtual, DragAndDrop) is a directive on
 * `<ng-container>`. The trigger and the content match the Vue preview
 * (`hosts/vue/previews.ts`).
 *
 * Like every preview of the host (`previews.ts`), the preview takes the shell's
 * props as its inputs and binds them to the component in its markup: an input
 * for every prop the page writes, and `ctrl`. An input is typed as the adapter
 * component's field, and a removed prop reaches it as `undefined`, so the
 * property returns to its default. The host does not hide a prop without an
 * input: a prop added to the descriptor but missing here is an error on its
 * page. The markup is one copy (`<ng-template pg-copy>`), and the component in
 * it goes to the host (`subjects`), which listens to its outputs.
 */

/**
 * Popover: the trigger is a Button that puts the link to the panel and the
 * pressed look on itself with the attribute set directive (`so-attributes`).
 * The content has a button for focus to move to on open. The content is the
 * `default` template, like the Vue preview's slot: a projection would be
 * created at once, and the `lazyMount` row would only keep it out of the
 * document.
 */
@Component({
	selector: 'pg-popover-preview',
	imports: [
		TPopoverComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
		CopyDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<span
				so-popover
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[open]="open()"
				[closable]="closable()"
				[lazyMount]="lazyMount()"
				[placement]="placement()"
				[contained]="contained()"
				[edge]="edge()"
				[swipe]="swipe()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[dismiss_enabled]="dismiss_enabled()"
			>
				<ng-template
					slot="trigger"
					let-triggerAria="triggerAria"
					let-triggerDataset="triggerDataset"
				>
					<button
						so-button
						text="Открыть"
						[so-attributes]="{ ...triggerAria, ...triggerDataset }"
					></button>
				</ng-template>
				<ng-template slot="default">
					<p style="margin: 0 0 8px">Произвольное содержимое: текст, поля, кнопки</p>
					<button so-button text="Действие"></button>
				</ng-template>
			</span>
		</ng-template>
	`,
})
export class PopoverPreview implements TFixture {
	readonly ctrl = input<TPopoverComponent['ctrl']>()
	readonly rendered = input<TPopoverComponent['rendered']>()
	readonly visible = input<TPopoverComponent['visible']>()
	readonly direction = input<TPopoverComponent['direction']>()
	readonly open = input<TPopoverComponent['open']>()
	readonly closable = input<TPopoverComponent['closable']>()
	readonly lazyMount = input<TPopoverComponent['lazyMount']>()
	readonly placement = input<TPopoverComponent['placement']>()
	readonly contained = input<TPopoverComponent['contained']>()
	readonly edge = input<TPopoverComponent['edge']>()
	readonly swipe = input<TPopoverComponent['swipe']>()
	readonly aria_label = input<TPopoverComponent['aria_label']>()
	readonly aria_labelledBy = input<TPopoverComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TPopoverComponent['aria_describedBy']>()
	readonly dismiss_enabled = input<TPopoverComponent['dismiss_enabled']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TPopoverComponent)
}

/**
 * Tooltip: the trigger is a Button that puts the panel reference
 * (`aria-describedby`) on itself with the attribute set directive. The
 * tooltip text is content: there is no text prop.
 */
@Component({
	selector: 'pg-tooltip-preview',
	imports: [
		TTooltipComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
		CopyDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<span
				so-tooltip
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[open]="open()"
				[placement]="placement()"
				[openDelay]="openDelay()"
				[closeDelay]="closeDelay()"
				[type]="type()"
				[dismiss_enabled]="dismiss_enabled()"
			>
				<ng-template slot="trigger" let-triggerAria="triggerAria">
					<button so-button text="Наведи" [so-attributes]="triggerAria"></button>
				</ng-template>
				Короткое пояснение к кнопке
			</span>
		</ng-template>
	`,
})
export class TooltipPreview implements TFixture {
	readonly ctrl = input<TTooltipComponent['ctrl']>()
	readonly rendered = input<TTooltipComponent['rendered']>()
	readonly visible = input<TTooltipComponent['visible']>()
	readonly direction = input<TTooltipComponent['direction']>()
	readonly open = input<TTooltipComponent['open']>()
	readonly placement = input<TTooltipComponent['placement']>()
	readonly openDelay = input<TTooltipComponent['openDelay']>()
	readonly closeDelay = input<TTooltipComponent['closeDelay']>()
	readonly type = input<TTooltipComponent['type']>()
	readonly dismiss_enabled = input<TTooltipComponent['dismiss_enabled']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTooltipComponent)
}

/**
 * The inputs of a menu preview (one for every prop the page writes, and
 * `ctrl`) and the menu in each copy (`subjects`), shared by the menu with
 * items in markup and the menu from data (`MenuPreview`, `MenuItemsPreview`).
 */
@Directive()
abstract class TMenuPreviewInputs implements TFixture {
	readonly ctrl = input<TMenuComponent['ctrl']>()
	readonly engine = input<TMenuComponent['engine']>()
	readonly items = input<TMenuComponent['items']>()
	readonly groups = input<TMenuComponent['groups']>()
	readonly groupBy = input<TMenuComponent['groupBy']>()
	readonly rendered = input<TMenuComponent['rendered']>()
	readonly visible = input<TMenuComponent['visible']>()
	readonly direction = input<TMenuComponent['direction']>()
	readonly size = input<TMenuComponent['size']>()
	readonly variant = input<TMenuComponent['variant']>()
	readonly open = input<TMenuComponent['open']>()
	readonly placement = input<TMenuComponent['placement']>()
	readonly openOn = input<TMenuComponent['openOn']>()
	readonly groupSeparators = input<TMenuComponent['groupSeparators']>()
	readonly dismiss_enabled = input<TMenuComponent['dismiss_enabled']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TMenuComponent)
}

/**
 * Bindings of the preview's menu to the preview's inputs, except the content;
 * the same for both menus. Only the menu from data passes `items`: in the
 * markup menu the markup takes its place.
 */
const MENU_BINDINGS = `
	[ctrl]="ctrl()"
	[engine]="engine()"
	[groups]="groups()"
	[groupBy]="groupBy()"
	[rendered]="rendered()"
	[visible]="visible()"
	[direction]="direction()"
	[size]="size()"
	[variant]="variant()"
	[open]="open()"
	[placement]="placement()"
	[openOn]="openOn()"
	[groupSeparators]="groupSeparators()"
	[dismiss_enabled]="dismiss_enabled()"
`

/**
 * The menu trigger: a Button that puts the link to the menu and the pressed
 * look on itself with the attribute set directive. A context menu (`openOn:
 * 'contextmenu'`) gets an area in the slot, like a consumer's "file": the
 * menu opens over it by right click, long press and Shift+F10, and the panel
 * sits at the point of the call. The area is a native button, as in Vue:
 * focusable for Shift+F10, with its own role and name, and no link to the
 * menu. The area reads the mode from the column's props: the instance column
 * has none, and there the menu opens over the button.
 */
const MENU_TRIGGER = `
	<ng-template slot="trigger" let-triggerAria="triggerAria" let-triggerDataset="triggerDataset">
		@if (openOn() === 'contextmenu') {
			<button type="button" style="padding: 24px 32px; border: 1px dashed; border-radius: 8px">
				Правая кнопка, долгое касание или Shift+F10
			</button>
		} @else {
			<button
				so-button
				text="Действия"
				[so-attributes]="{ ...triggerAria, ...triggerDataset }"
			></button>
		}
	</ng-template>
`

/**
 * Menu: items in markup, as in Vue: a labelled group of checkboxes, a group
 * of radios with one checked, actions with shortcut hints, a submenu with a
 * submenu inside, an item with a panel (a calendar mounted on first open), a
 * disabled action and a "dangerous" item with its own variant. The items of
 * the menu and of each submenu are their `default` template, as a consumer
 * who wants them lazy writes them: the menu creates it on the first opening
 * of its panel, while Angular would create a projection together with the
 * menu.
 *
 * When the items came as data (`items` from the page's groups block or the
 * `groupSeparators` row preset), the preview is a different one,
 * `MenuItemsPreview`: markup would replace the data, and the menu draws groups
 * from data. Not an `@if` around the items: Angular picks the fallback content
 * of `<ng-content>` once, and an `@if` in the content takes the projection
 * even with a false condition. Nor a second menu in an `@else` branch: the
 * host listens to the menu's outputs in each copy (`subjects`) as soon as the
 * copies are created, before the first check, and a menu in a branch would
 * appear only during that check. So the host picks the preview when it places
 * it (`templateFor`).
 */
@Component({
	selector: 'pg-menu-preview',
	imports: [
		TMenuComponent,
		TMenuItemComponent,
		TMenuCheckboxItemComponent,
		TMenuRadioGroupComponent,
		TMenuRadioItemComponent,
		TMenuGroupComponent,
		TMenuSeparatorComponent,
		TMenuSubmenuComponent,
		TMenuPopoverItemComponent,
		TCalendarComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
		CopyDirective,
		PartDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<span so-menu ${MENU_BINDINGS}>
				${MENU_TRIGGER}
				<ng-template slot="default">
					<div so-menu-group label="Вид">
						<div so-menu-checkbox-item pg-part value="grid" text="Сетка" selected></div>
						<div so-menu-checkbox-item pg-part value="ruler" text="Линейка"></div>
					</div>
					<div so-menu-separator></div>
					<div so-menu-radio-group label="Сортировка" value="name">
						<div so-menu-radio-item pg-part value="name" text="По имени"></div>
						<div so-menu-radio-item pg-part value="date" text="По дате"></div>
					</div>
					<div so-menu-separator></div>
					<div so-menu-item pg-part value="edit" text="Изменить">
						<span slot="trailing">Ctrl+E</span>
					</div>
					<div so-menu-item pg-part value="copy" text="Дублировать">
						<span slot="trailing">Ctrl+D</span>
					</div>
					<div so-menu-submenu pg-part value="share" text="Поделиться">
						<ng-template slot="default">
							<div so-menu-item pg-part value="link" text="Ссылка"></div>
							<div so-menu-item pg-part value="mail" text="Почта"></div>
							<div so-menu-submenu pg-part value="messengers" text="Мессенджеры">
								<ng-template slot="default">
									<div
										so-menu-item
										pg-part
										value="telegram"
										text="Telegram"
									></div>
									<div
										so-menu-item
										pg-part
										value="whatsapp"
										text="WhatsApp"
									></div>
								</ng-template>
							</div>
						</ng-template>
					</div>
					<div so-menu-popover-item pg-part value="due" text="Срок" lazyMount>
						<ng-template slot="default"><div so-calendar></div></ng-template>
					</div>
					<div so-menu-item pg-part value="archive" text="В архив" disabled></div>
					<div so-menu-separator></div>
					<div so-menu-item pg-part value="remove" text="Удалить" variant="negative">
						<span slot="trailing">Del</span>
					</div>
				</ng-template>
			</span>
		</ng-template>
	`,
})
export class MenuPreview extends TMenuPreviewInputs {}

/**
 * Menu from data: the content is `items` from the page's groups block or the
 * `groupSeparators` row preset, with no items in markup: the menu draws its
 * own by group sections. The trigger is the same as in `MenuPreview`.
 */
@Component({
	selector: 'pg-menu-items-preview',
	imports: [TMenuComponent, TButtonComponent, SlotDirective, AttributesDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<span so-menu [items]="items()" ${MENU_BINDINGS}> ${MENU_TRIGGER} </span>
		</ng-template>
	`,
})
export class MenuItemsPreview extends TMenuPreviewInputs {}

/**
 * Dialog: on the playground a button opens the dialog, as in Vue: closed it
 * is hidden, and open it covers the page with a backdrop, so showing it at
 * once would block the rest of the page.
 *
 * Openness is a copy's own state (`state`, the context of its view): a
 * signal the `visible` input overwrites (`linkedSignal`), like
 * `v-model:visible` on local state in Vue. The close button, Escape and the
 * backdrop close the dialog through `(soChangeVisible)`, the footer buttons
 * by writing the signal, and the `visible` row sets it from outside. With a
 * core instance (the second column) the path is the same: writing the
 * instance's `visible` opens the dialog, and the output comes back here. Each
 * copy opens its own dialog.
 */
@Component({
	selector: 'pg-dialog-preview',
	imports: [TDialogComponent, TButtonComponent, TInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy [pg-copy-state]="state" let-shown="shown">
			<button so-button text="Открыть окно" (click)="shown.set(true)"></button>
			<div
				so-dialog
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="shown()"
				[direction]="direction()"
				[target]="target()"
				[width]="width()"
				[height]="height()"
				[closable]="closable()"
				[dismissible]="dismissible()"
				[modal]="modal()"
				[placement]="placement()"
				[offset]="offset()"
				[maximized]="maximized()"
				[maximizable]="maximizable()"
				[alert]="alert()"
				[dismiss_enabled]="dismiss_enabled()"
				[hideOutside_enabled]="hideOutside_enabled()"
				[scrollLock_enabled]="scrollLock_enabled()"
				(soChangeVisible)="shown.set($event.newValue)"
			>
				<span slot="title">Настройки</span>
				<p style="margin: 0 0 8px">Произвольное содержимое: текст, поля, кнопки</p>
				<div so-input placeholder="Имя"></div>
				<button so-button slot="footer" text="Отмена" (click)="shown.set(false)"></button>
				<button
					so-button
					slot="footer"
					text="Сохранить"
					(click)="shown.set(false)"
				></button>
			</div>
		</ng-template>
	`,
})
export class DialogPreview implements TFixture {
	readonly ctrl = input<TDialogComponent['ctrl']>()
	readonly rendered = input<TDialogComponent['rendered']>()
	readonly visible = input<TDialogComponent['visible']>()
	readonly direction = input<TDialogComponent['direction']>()
	readonly target = input<TDialogComponent['target']>()
	readonly width = input<TDialogComponent['width']>()
	readonly height = input<TDialogComponent['height']>()
	readonly closable = input<TDialogComponent['closable']>()
	readonly dismissible = input<TDialogComponent['dismissible']>()
	readonly modal = input<TDialogComponent['modal']>()
	readonly placement = input<TDialogComponent['placement']>()
	readonly offset = input<TDialogComponent['offset']>()
	readonly maximized = input<TDialogComponent['maximized']>()
	readonly maximizable = input<TDialogComponent['maximizable']>()
	readonly alert = input<TDialogComponent['alert']>()
	readonly dismiss_enabled = input<TDialogComponent['dismiss_enabled']>()
	readonly hideOutside_enabled = input<TDialogComponent['hideOutside_enabled']>()
	readonly scrollLock_enabled = input<TDialogComponent['scrollLock_enabled']>()
	/**
	 * A copy's own state: whether its dialog is open; the `visible` input
	 * overwrites it.
	 */
	readonly state = () => ({ shown: linkedSignal(() => this.visible() ?? false) })
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDialogComponent)
}

@Component({
	selector: 'pg-guide-preview',
	imports: [TGuideComponent, TButtonComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy [pg-copy-state]="state" let-shown="shown">
			<button so-button text="Запустить Guide" (click)="shown.set(true)"></button>
			<div
				so-guide
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="shown()"
				[direction]="direction()"
				[target]="target()"
				[steps]="steps()"
				[backdrop]="backdrop()"
				[closable]="closable()"
				[hideOutside_enabled]="hideOutside_enabled()"
				[scrollLock_enabled]="scrollLock_enabled()"
				(soChangeVisible)="shown.set($event.newValue)"
			></div>
		</ng-template>
	`,
})
export class GuidePreview implements TFixture {
	readonly ctrl = input<TGuideComponent['ctrl']>()
	readonly rendered = input<TGuideComponent['rendered']>()
	readonly visible = input<TGuideComponent['visible']>()
	readonly direction = input<TGuideComponent['direction']>()
	readonly target = input<TGuideComponent['target']>()
	readonly steps = input<TGuideComponent['steps']>()
	readonly backdrop = input<TGuideComponent['backdrop']>()
	readonly closable = input<TGuideComponent['closable']>()
	readonly hideOutside_enabled = input<TGuideComponent['hideOutside_enabled']>()
	readonly scrollLock_enabled = input<TGuideComponent['scrollLock_enabled']>()
	readonly state = () => ({ shown: linkedSignal(() => this.visible() ?? false) })
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TGuideComponent)
}

@Component({
	selector: 'pg-alert-dialog-preview',
	imports: [TAlertDialogComponent, TButtonComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy [pg-copy-state]="state" let-shown="shown">
			<button so-button text="Открыть окно" (click)="shown.set(true)"></button>
			<div
				so-alert-dialog
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="shown()"
				[direction]="direction()"
				[target]="target()"
				[width]="width()"
				[height]="height()"
				[closable]="closable()"
				[dismissible]="dismissible()"
				[dismiss_enabled]="dismiss_enabled()"
				[hideOutside_enabled]="hideOutside_enabled()"
				[scrollLock_enabled]="scrollLock_enabled()"
				(soChangeVisible)="shown.set($event.newValue)"
			>
				<span slot="title">Удалить запись?</span>
				<p>Удалённую запись нельзя будет восстановить.</p>
				<span slot="action">Удалить</span>
			</div>
		</ng-template>
	`,
})
export class AlertDialogPreview implements TFixture {
	readonly ctrl = input<TAlertDialogComponent['ctrl']>()
	readonly rendered = input<TAlertDialogComponent['rendered']>()
	readonly visible = input<TAlertDialogComponent['visible']>()
	readonly direction = input<TAlertDialogComponent['direction']>()
	readonly target = input<TAlertDialogComponent['target']>()
	readonly width = input<TAlertDialogComponent['width']>()
	readonly height = input<TAlertDialogComponent['height']>()
	readonly closable = input<TAlertDialogComponent['closable']>()
	readonly dismissible = input<TAlertDialogComponent['dismissible']>()
	readonly dismiss_enabled = input<TAlertDialogComponent['dismiss_enabled']>()
	readonly hideOutside_enabled = input<TAlertDialogComponent['hideOutside_enabled']>()
	readonly scrollLock_enabled = input<TAlertDialogComponent['scrollLock_enabled']>()
	/**
	 * A copy's own state: whether its dialog is open; the `visible` input
	 * overwrites it.
	 */
	readonly state = () => ({ shown: linkedSignal(() => this.visible() ?? false) })
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAlertDialogComponent)
}

/**
 * Drawer: a button opens the drawer too, for the same reason as the dialog
 * and on the same per-copy state (see `DialogPreview`).
 *
 * The button and the drawer sit in their own box with `position: relative`,
 * as in Vue: with `contained` the drawer is not moved out but placed in the
 * nearest positioned ancestor, so the `contained` row shows it in the
 * preview's box rather than at the edge of the whole page.
 */
@Component({
	selector: 'pg-drawer-preview',
	imports: [TDrawerComponent, TButtonComponent, TInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy [pg-copy-state]="state" let-shown="shown">
			<div style="position: relative; width: 100%; min-height: 240px; overflow: hidden">
				<button so-button text="Открыть панель" (click)="shown.set(true)"></button>
				<div
					so-drawer
					[ctrl]="ctrl()"
					[rendered]="rendered()"
					[visible]="shown()"
					[direction]="direction()"
					[target]="target()"
					[width]="width()"
					[height]="height()"
					[closable]="closable()"
					[dismissible]="dismissible()"
					[placement]="placement()"
					[swipe]="swipe()"
					[contained]="contained()"
					[dismiss_enabled]="dismiss_enabled()"
					[hideOutside_enabled]="hideOutside_enabled()"
					[scrollLock_enabled]="scrollLock_enabled()"
					(soChangeVisible)="shown.set($event.newValue)"
				>
					<span slot="title">Фильтры</span>
					<p style="margin: 0 0 8px">Произвольное содержимое: текст, поля, кнопки</p>
					<div so-input placeholder="Поиск"></div>
					<button
						so-button
						slot="footer"
						text="Сбросить"
						(click)="shown.set(false)"
					></button>
					<button
						so-button
						slot="footer"
						text="Применить"
						(click)="shown.set(false)"
					></button>
				</div>
			</div>
		</ng-template>
	`,
})
export class DrawerPreview implements TFixture {
	readonly ctrl = input<TDrawerComponent['ctrl']>()
	readonly rendered = input<TDrawerComponent['rendered']>()
	readonly visible = input<TDrawerComponent['visible']>()
	readonly direction = input<TDrawerComponent['direction']>()
	readonly target = input<TDrawerComponent['target']>()
	readonly width = input<TDrawerComponent['width']>()
	readonly height = input<TDrawerComponent['height']>()
	readonly closable = input<TDrawerComponent['closable']>()
	readonly dismissible = input<TDrawerComponent['dismissible']>()
	readonly placement = input<TDrawerComponent['placement']>()
	readonly swipe = input<TDrawerComponent['swipe']>()
	readonly contained = input<TDrawerComponent['contained']>()
	readonly dismiss_enabled = input<TDrawerComponent['dismiss_enabled']>()
	readonly hideOutside_enabled = input<TDrawerComponent['hideOutside_enabled']>()
	readonly scrollLock_enabled = input<TDrawerComponent['scrollLock_enabled']>()
	/**
	 * A copy's own state: whether its drawer is open; the `visible` input
	 * overwrites it.
	 */
	readonly state = () => ({ shown: linkedSignal(() => this.visible() ?? false) })
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDrawerComponent)
}

/**
 * Custom toast content, an Undo button: the toast comes to it as the `toast`
 * input and is closed by it. The component has no box: the button sits in
 * the row of the toast's custom content, like the button the Vue component
 * draws.
 */
@Component({
	selector: 'pg-toast-undo',
	imports: [TButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<button so-button text="Отменить" (click)="toast().close()"></button>`,
})
class ToastUndo {
	readonly toast = input.required<IToastsItem>()
}

/** This host's custom content for the toast samples. */
const undo: TToastRender = ToastUndo

/**
 * Toasts come from code, not markup: buttons inside the manager take the API
 * (`useToasts()` in a field) and show a toast. What a toast says comes from
 * the playground samples, the same for every host (`toastSample`); this
 * host's custom content for them is the Undo button. The text starts with a
 * number, so the stack shows which toast is where.
 *
 * One button per plain message and per type (`TOASTS_ITEM_TYPES`): a toast
 * shows its type's icon. The last one is pending: "Saving…" with a ring in
 * place of the icon does not close by itself, and a couple of seconds later
 * the same toast reports success. The row wraps, as in Vue.
 */
@Component({
	selector: 'pg-toasts-trigger',
	imports: [TButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<div style="display: flex; flex-wrap: wrap; gap: 8px">
		<button so-button text="обычное" (click)="notify()"></button>
		@for (type of types; track type) {
			<button so-button [text]="type" (click)="notify(type)"></button>
		}
		<button so-button text="загрузка → готово" (click)="save()"></button>
	</div>`,
})
class ToastsTrigger {
	protected readonly types = TOASTS_ITEM_TYPES

	private readonly _toasts = useToasts()

	private _count = 0

	protected notify(type?: TToastsItemType): void {
		const sample = toastSample(type, undo)

		this._count += 1
		this._toasts.show({ ...sample, text: `${this._count}. ${sample.text}`, type })
	}

	// While the work runs the toast waits; when it ends the same toast reports the result
	protected save(): void {
		this._count += 1

		const toast = this._toasts.show({ text: `${this._count}. Сохраняем…`, loading: true })
		const done = `${this._count}. Сохранено`

		setTimeout(() => {
			if (!toast) return

			toast.loading = false
			toast.type = 'success'
			toast.text = done
		}, TOAST_SAVING)
	}
}

/**
 * Toasts: the manager around a row of buttons that show toasts, as in Vue: a
 * box-less `<div so-toasts>`, with the toast region moved to the window edge,
 * outside the preview cell. The buttons need the manager above them
 * (`useToasts()`), which a template gives only to its markup, so the preview
 * is a template of its own.
 */
@Component({
	selector: 'pg-toasts-preview',
	imports: [TToastsComponent, ToastsTrigger, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-toasts
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[target]="target()"
				[placement]="placement()"
				[layout]="layout()"
				[view]="view()"
				[max]="max()"
				[duration]="duration()"
			>
				<pg-toasts-trigger />
			</div>
		</ng-template>
	`,
})
export class ToastsPreview implements TFixture {
	readonly ctrl = input<TToastsComponent['ctrl']>()
	readonly rendered = input<TToastsComponent['rendered']>()
	readonly visible = input<TToastsComponent['visible']>()
	readonly direction = input<TToastsComponent['direction']>()
	readonly target = input<TToastsComponent['target']>()
	readonly placement = input<TToastsComponent['placement']>()
	readonly layout = input<TToastsComponent['layout']>()
	readonly view = input<TToastsComponent['view']>()
	readonly max = input<TToastsComponent['max']>()
	readonly duration = input<TToastsComponent['duration']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TToastsComponent)
}

/**
 * DragAndDrop: reordering in three collections at once, over the same items,
 * as in Vue and React: `<ng-container so-drag-and-drop>` around a row. Tabs
 * and Accordion as parts in markup, ListBox by data. An item moves within its
 * own collection: the wrapper does not move items between collections. The
 * row bounds the width: the tabs take its full width, the list and the
 * sections sit below, side by side. The first tab is active at once,
 * otherwise no panel mounts, and the panels go to the `content` slot, outside
 * the tab list.
 */
@Component({
	selector: 'pg-drag-and-drop-preview',
	imports: [
		TDragAndDropComponent,
		TTabsComponent,
		TTabsItemComponent,
		TTabsContentComponent,
		TListBoxComponent,
		TAccordionComponent,
		TAccordionItemComponent,

		CopyDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<ng-container so-drag-and-drop [ctrl]="ctrl()">
				<div
					style="display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; width: 100%"
				>
					<div style="flex: 1 1 100%; min-width: 0">
						<div so-tabs>
							@for (item of items; track item.value; let first = $first) {
								<div
									so-tabs-item
									[value]="item.value"
									[text]="item.text"
									[active]="first"
								></div>
							}
							@for (item of items; track item.value) {
								<div so-tabs-content slot="content" [value]="item.value">
									<div style="padding: 12px">Панель «{{ item.text }}»</div>
								</div>
							}
						</div>
					</div>
					<div so-list-box [items]="items" aria_label="Пункты"></div>
					<div style="flex: 1; min-width: 200px">
						<div so-accordion>
							@for (item of items; track item.value) {
								<div so-accordion-item [value]="item.value" [text]="item.text">
									<div style="padding: 4px 0">Содержимое «{{ item.text }}»</div>
								</div>
							}
						</div>
					</div>
				</div>
			</ng-container>
		</ng-template>
	`,
})
export class DragAndDropPreview implements TFixture {
	readonly ctrl = input<TDragAndDropComponent['ctrl']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDragAndDropComponent)
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly items = COLLECTION_ITEMS
}

/**
 * Virtual: the window over three lists of a thousand items each (with five it
 * is not visible), `<ng-container so-virtual>` around a row. ListBox with a
 * row limit scrolls itself, Select scrolls the list of its panel, the table
 * sits in a 320 px scroll window; the `enabled` row turns the window on and
 * off for all of them at once. Items are data (`items`): the window does not
 * hide items placed in markup. The row bounds the width, as in Vue and React,
 * and Select sits in a column of its own width: its field takes the full
 * width and would take the table's room in the row. The table drags a moved
 * column whole, with the rows' cells (`reorderPreview="column"`): inside the
 * window that is hundreds of cells, not thousands.
 */
@Component({
	selector: 'pg-virtual-preview',
	imports: [
		TVirtualComponent,
		TListBoxComponent,
		TSelectComponent,
		TTableComponent,
		CopyDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<ng-container so-virtual [ctrl]="ctrl()" [enabled]="enabled()">
				<div style="display: flex; gap: 24px; align-items: flex-start; width: 100%">
					<div so-list-box [items]="items" [maxRows]="8" aria_label="Пункты"></div>
					<div style="flex: none; width: 220px">
						<div so-select [items]="items" placeholder="Выберите"></div>
					</div>
					<div style="flex: 1; min-width: 0; height: 320px; overflow: auto">
						<div
							so-table
							[items]="rows"
							[columns]="columns"
							reorderPreview="column"
							[resizable]="true"
							[reorderable]="true"
							aria_label="Сотрудники"
						></div>
					</div>
				</div>
			</ng-container>
		</ng-template>
	`,
})
export class VirtualPreview implements TFixture {
	readonly ctrl = input<TVirtualComponent['ctrl']>()
	readonly enabled = input<TVirtualComponent['enabled']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TVirtualComponent)
	protected readonly items = COLLECTION_MANY_ITEMS
	protected readonly rows = TABLE_MANY_ROWS
	protected readonly columns = TABLE_COLUMNS
}
