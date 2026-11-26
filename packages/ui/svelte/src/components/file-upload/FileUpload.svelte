<script lang="ts">
	import { Dynamic, toRootProps } from '../../adapter'
	import { setupFileUpload } from './setup.component'
	import type { FileUploadProps } from './base.component'

	let { ref = $bindable(), ...props }: FileUploadProps = $props()
	const mountId = $props.id()
	const binding = setupFileUpload(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset], binding.forwardProps)}
	attach={binding.attachElement}
>
	<input
		class="so-file-upload__input"
		type="file"
		tabindex="-1"
		aria-label={state.names_choose}
		accept={state.accept || undefined}
		name={state.name || undefined}
		form={state.form || undefined}
		multiple={state.multiple}
		required={state.required}
		disabled={state.disabled}
	/>
	<div class="so-file-upload__dropzone">
		<span class="so-file-upload__symbol" aria-hidden="true">&#8593;</span>
		<button class="so-file-upload__choose" type="button" disabled={state.disabled}>{state.names_choose}</button>
		<div class="so-file-upload__hint">{state.names_hint}</div>
	</div>
	<div class="so-file-upload__message" role="status">{state.names_message}</div>
	{#if state.names_rows?.length}
		<ul class="so-file-upload__list" role="list">
			{#each state.names_rows as row (row.id)}
				<li class="so-file-upload__item">
					<div class="so-file-upload__preview" aria-hidden="true">
						{#if state.native_previews?.[row.id]}
							<img src={state.native_previews[row.id]} alt="" />
						{:else}
							<span>{row.extension}</span>
						{/if}
					</div>
					<div class="so-file-upload__details">
						<bdi>{row.file.name}</bdi>
						<span class="so-file-upload__size">{row.sizeText}</span>
					</div>
					<button
						class="so-file-upload__remove"
						type="button"
						data-file-id={row.id}
						aria-label={row.removeLabel}
						disabled={state.disabled}
					>&times;</button>
					{#if props['item-progress']}
						<div class="so-file-upload__progress">
							{@render props['item-progress']({ file: row.file, id: row.id })}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Dynamic>
