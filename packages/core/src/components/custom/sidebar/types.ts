import type { TValuePayload } from '../../../common'
import type {
	IComponentView,
	IComponentViewProps,
	TComponentViewEvents,
} from '../../base/component-view'
import type { ITextable, ITextableProps, TTextableEvents } from '../../base/textable'

export type TSidebarSide = 'left' | 'right'
export type TSidebarCollapse = 'icon' | 'offcanvas'

export interface ISidebarProps extends IComponentViewProps {
	side?: TSidebarSide
	collapse?: TSidebarCollapse
	collapsed?: boolean
}

export type TSidebarEvents = TComponentViewEvents & {
	'change:side': (payload: TValuePayload<TSidebarSide>) => void
	'change:collapse': (payload: TValuePayload<TSidebarCollapse>) => void
	'change:collapsed': (payload: TValuePayload<boolean>) => void
}

export interface ISidebar extends IComponentView<ISidebarProps, TSidebarEvents> {
	side: TSidebarSide
	collapse: TSidebarCollapse
	collapsed: boolean
	readonly offcanvasHidden: boolean
	toggle(): void
}

export interface ISidebarItemProps extends ITextableProps {
	href?: string
}

export type TSidebarItemEvents = TTextableEvents & {
	'change:href': (payload: TValuePayload<string | undefined>) => void
}

export interface ISidebarItem extends ITextable<ISidebarItemProps, TSidebarItemEvents> {
	href: string | undefined
}
