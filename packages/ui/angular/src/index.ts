/** Application API. Assembly helpers stay inside the adapter. */

export {
	TComponentComponent,
	TComponentViewComponent,
	TButtonComponent,
	TItemRowComponent,
	TIconComponent,
	TLabelComponent,
	TFieldComponent,
	TProgressSpinnerComponent,
	TProgressLinearComponent,
	TSkeletonComponent,
	TFrameComponent,
	TPopoverComponent,
	TTooltipComponent,
	TMenuComponent,
	TMenuItemComponent,
	TMenuCheckboxItemComponent,
	TMenuRadioItemComponent,
	TMenuRadioGroupComponent,
	TMenuGroupComponent,
	TMenuSeparatorComponent,
	TMenuSubmenuComponent,
	TMenuPopoverItemComponent,
	TDialogComponent,
	TAlertDialogComponent,
	TDrawerComponent,
	TToastsComponent,
	TInputComponent,
	TNumberInputComponent,
	TTextareaComponent,
	TDateInputComponent,
	TCheckBoxComponent,
	TSwitchComponent,
	TSliderComponent,
	TRatingComponent,
	TListBoxComponent,
	TListBoxItemComponent,
	TListBoxGroupComponent,
	TTagsComponent,
	TTagsItemComponent,
	TSelectComponent,
	TSelectItemComponent,
	TSelectGroupComponent,
	TRadioGroupComponent,
	TRadioGroupItemComponent,
	TTabsComponent,
	TTabsItemComponent,
	TTabsContentComponent,
	TAccordionComponent,
	TAccordionItemComponent,
	TPaginationComponent,
	TCalendarComponent,
	TCalendarItemComponent,
	TDatePickerComponent,
	TScrollerComponent,
	TTableComponent,
	TTableColumnComponent,
	TTableRowComponent,
	TVirtualComponent,
	TDragAndDropComponent,
} from './components'

export { AttributesDirective, TextPipe, SlotDirective, ɵSubtreeDirective } from './adapter/runtime'

export { LocaleProviderDirective } from './adapter/locale'

export { provideAttrs } from './adapter/attrs'

export { useToasts } from './adapter/toasts'

export { RoleIconDirective } from './adapter/common'

export type { TToastRender } from './adapter/toasts'

// Host directives must be reachable from the package entry for Angular AOT.
export { ValueAccessorDirective as ɵValueAccessorDirective } from './adapter/runtime/value-accessor.directive'

export { TBreadcrumbsComponent, TBreadcrumbsItemComponent } from './components/breadcrumbs'

export { TBadgeComponent } from './components/badge'

export { TToggleButtonComponent } from './components/toggle-button'
export { TToggleGroupComponent, TToggleGroupItemComponent } from './components/toggle-group'
export { TCodeBlockComponent } from './components/code-block'

export { TAlertComponent } from './components/alert'
export { TAvatarComponent, TAvatarGroupComponent } from './components/avatar'
export { TSeparatorComponent } from './components/separator'

export type { ICollectionInitialSource, ICollectionInitialPanel } from '@soxa-ui/plugins'
export { TSelectSeparatorComponent } from './components/select/separator'
export { TListBoxSeparatorComponent } from './components/list-box/separator'

export { TFileUploadComponent } from './components/file-upload'

export {
	TSplitterComponent,
	TSplitterPanelComponent,
	TSplitterHandleComponent,
} from './components/splitter'
export { TGuideComponent } from './components/guide'
