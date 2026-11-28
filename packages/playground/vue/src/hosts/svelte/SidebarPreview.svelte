<script lang="ts">
	import { Avatar, Icon, Input, Menu, Sidebar, roleIcon } from '@soxa-ui/svelte'
	import type { DescriptorSlots, MenuDescriptor } from '@soxa-ui/setup'
	import { SIDEBAR_BRAND, SIDEBAR_PROFILE, SIDEBAR_SEARCH } from '../sidebar-content'
	import { SIDEBAR_GROUPS } from '@soxa-ui/playground-shared'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
	const ArrowDown = roleIcon('arrowDown')
	type TTriggerScope = DescriptorSlots<typeof MenuDescriptor>['trigger']
	const groups = SIDEBAR_GROUPS.map((group) => ({
		label: group.label,
		items: group.items.map((item) => ({ ...item, iconTag: roleIcon(item.icon) })),
	}))
</script>

<Sidebar aria_label={SIDEBAR_BRAND.name} {...bind}>
	<header class="pg-sidebar-header">
		<div class="pg-sidebar-brand">
			<img src={SIDEBAR_BRAND.mark} alt="" class="pg-sidebar-brand__mark" />
			<Sidebar.ExpandedOnly class="pg-sidebar-identity">
				<strong>{SIDEBAR_BRAND.name}</strong>
				<small>{SIDEBAR_BRAND.subtitle}</small>
			</Sidebar.ExpandedOnly>
		</div>
		<Sidebar.ExpandedOnly>
			<Input aria_label={SIDEBAR_SEARCH} placeholder={SIDEBAR_SEARCH} size="sm" />
		</Sidebar.ExpandedOnly>
	</header>
	{#each groups as group (group.label)}
		<div class="pg-sidebar-group" role="group" aria-label={group.label}>
			<div class="so-sidebar-group__label">{group.label}</div>
			{#each group.items as item (item.text)}
				<Sidebar.Item
					text={item.text}
					aria-current={item.current ? 'page' : undefined}
					data-selected={item.current ? 'true' : undefined}
				>
					{#snippet leading()}<Icon tag={item.iconTag} size="lg" />{/snippet}
				</Sidebar.Item>
			{/each}
		</div>
	{/each}
	<footer class="pg-sidebar-footer">
		<Menu items={SIDEBAR_PROFILE.items} placement="top-start">
			{#snippet trigger({ triggerAria, triggerDataset }: TTriggerScope)}
				<Sidebar.Item
					text={SIDEBAR_PROFILE.name}
					aria-label={SIDEBAR_PROFILE.label}
					{...triggerAria}
					{...triggerDataset}
				>
					{#snippet leading()}<Avatar initials={SIDEBAR_PROFILE.initials} size="sm" variant="accent" />{/snippet}
					<span class="pg-sidebar-profile-label">
						<span class="pg-sidebar-identity">
							<strong>{SIDEBAR_PROFILE.name}</strong>
							<small>{SIDEBAR_PROFILE.role}</small>
						</span>
						<Icon tag={ArrowDown} size="sm" aria-hidden="true" />
					</span>
				</Sidebar.Item>
			{/snippet}
		</Menu>
	</footer>
</Sidebar>
