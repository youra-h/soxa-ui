<script lang="ts">
	import { hasIcon } from '@soxa-ui/setup'
	import { Dynamic, toRootProps, roleIcon } from '../../adapter'
	import { Button } from '../button'
	import { Icon } from '../icon'
	import { setupFileUpload } from './setup.component'
	import type { FileUploadProps } from './base.component'

	let { ref = $bindable(), ...props }: FileUploadProps = $props()
	const mountId = $props.id()

	const binding = setupFileUpload(() => props, mountId, (node) => (ref = node))
	const state = binding.state

	const uploadIcon = roleIcon(hasIcon('upload') ? 'upload' : 'arrowUpward')
	const removeIcon = roleIcon('close')
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
		<button class="so-file-upload__choose" type="button" aria-label={state.names_choose} disabled={state.disabled}>
			<span class="so-file-upload__symbol" aria-hidden="true">
				<Icon embedded="file-upload.upload-icon" tag={uploadIcon} />
			</span>
		</button>
		<div class="so-file-upload__prompt">
			{state.names_drop}{' '}
			<button class="so-file-upload__browse" type="button" disabled={state.disabled}>{state.names_browse}</button>
		</div>
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
					<Button
						embedded="file-upload.remove"
						class="so-file-upload__remove"
						type="button"
						data-file-id={row.id}
						aria-label={row.removeLabel}
						disabled={state.disabled}
					>
						<Icon embedded="file-upload.remove-icon" tag={removeIcon} />
					</Button>
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
