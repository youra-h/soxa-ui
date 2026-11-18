import type { TPluginEvents } from '@soxa-ui/plugins'

export type AuditRecord = { prefix: string; text: string }
export type AuditEvents = TPluginEvents & {
	'change:prefix': (value: string) => void
	record: (value: AuditRecord) => void
}

declare module '@soxa-ui/setup' {
	interface IExternalPluginProps {
		audit_prefix?: string
	}
}
