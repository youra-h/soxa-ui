<script lang="ts">
	import { Select, type SelectProps } from '@soxa-ui/svelte'
	const props: SelectProps = $props()
</script>

<Select {...props} open>
	<Select.Group label="First"><Select.Item value="a" text="Apple" /></Select.Group>
	<Select.Separator />
	<Select.Group label="Second"><Select.Item value="b" text="Banana" /></Select.Group>
</Select>
