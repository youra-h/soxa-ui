<script lang="ts">
	import { TDatePicker, TSelect } from '@soxa-ui/core'
	import { DatePicker, Select } from '@soxa-ui/svelte'

	let {
		initialOpen = false,
		select = new TSelect({ open: initialOpen }),
		picker = new TDatePicker({ open: initialOpen, value: '2026-09-10' }),
	}: { initialOpen?: boolean; select?: TSelect; picker?: TDatePicker } = $props()
</script>

<form>
	<Select ctrl={select} aria_label="Destination" name="destination" items={[
		{ value: 'a', text: 'Alpha' },
		{ value: 'b', text: 'Beta' },
	]} />
	<DatePicker ctrl={picker} name="trip" />
</form>
