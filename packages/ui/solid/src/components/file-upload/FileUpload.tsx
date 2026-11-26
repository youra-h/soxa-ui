import { hasIcon } from '@soxa-ui/setup'
import type { JSX } from 'solid-js'
import { Root, createRootProps, hasSlot, renderSlot, roleIcon } from '../../adapter'
import { For, Show } from '../../adapter/runtime/flow'
import { setupFileUpload } from './setup.component'
import { Button } from '../button'
import { Icon } from '../icon'
import type { FileUploadProps } from './base.component'

const CLOSE = roleIcon('close')

export function FileUpload(props: FileUploadProps): JSX.Element {
	const binding = setupFileUpload(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))

	const UploadIcon = roleIcon(hasIcon('upload') ? 'upload' : 'arrowUpward')

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={root} ref={binding.ref}>
				<input
					class="so-file-upload__input"
					type="file"
					tabindex={-1}
					aria-label={state.names_choose}
					accept={state.accept || undefined}
					name={state.name || undefined}
					form={state.form || undefined}
					multiple={state.multiple}
					required={state.required}
					disabled={state.disabled}
				/>
				<div class="so-file-upload__dropzone">
					<button
						class="so-file-upload__choose"
						type="button"
						aria-label={state.names_choose}
						disabled={state.disabled}
					>
						<span class="so-file-upload__symbol" aria-hidden="true">
							<UploadIcon />
						</span>
					</button>
					<div class="so-file-upload__prompt">
						{state.names_drop}{' '}
						<button
							class="so-file-upload__browse"
							type="button"
							disabled={state.disabled}
						>
							{state.names_browse}
						</button>
					</div>
					<div class="so-file-upload__hint">{state.names_hint}</div>
				</div>
				<div class="so-file-upload__message" role="status">
					{state.names_message}
				</div>
				<Show when={state.names_rows?.length}>
					<ul class="so-file-upload__list" role="list">
						<For each={state.names_rows}>
							{(row) => (
								<li class="so-file-upload__item">
									<div class="so-file-upload__preview" aria-hidden="true">
										<Show
											when={state.native_previews?.[row.id]}
											fallback={<span>{row.extension}</span>}
										>
											<img src={state.native_previews?.[row.id]} alt="" />
										</Show>
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
										<Icon embedded="file-upload.remove-icon" tag={CLOSE} />
									</Button>
									<Show when={hasSlot(props['item-progress'])}>
										<div class="so-file-upload__progress">
											{renderSlot(props['item-progress'], {
												file: row.file,
												id: row.id,
											})}
										</div>
									</Show>
								</li>
							)}
						</For>
					</ul>
				</Show>
			</Root>
		</Show>
	)
}
