<script lang="ts">
	import { ListBox, type ListBoxProps } from '@soxa-ui/svelte'
	const props: ListBoxProps = $props()
</script>

<ListBox {...props} >
	<ListBox.Group label="First"><ListBox.Item value="a" text="Apple" /></ListBox.Group>
	<ListBox.Separator />
	<ListBox.Group label="Second"><ListBox.Item value="b" text="Banana" /></ListBox.Group>
</ListBox>
