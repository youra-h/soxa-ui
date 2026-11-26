import { hasIcon } from '@soxa-ui/setup'
import type { ElementType, ReactElement } from 'react'
import { hasSlot, renderSlot, toRootProps, roleIcon } from '../../adapter'
import { useSetupFileUpload } from './setup.component'
import { Button } from '../button'
import { Icon } from '../icon'
import type { FileUploadProps } from './base.component'

const CLOSE = roleIcon('close')

export function FileUpload(props: FileUploadProps): ReactElement | null {
	const { ref, forwardProps, state } = useSetupFileUpload(props)
	if (!state.rendered) return null

	const Tag = state.tag as ElementType
	const rows = state.names_rows ?? []
	const progress = props['item-progress']

	const UploadIcon = roleIcon(hasIcon('upload') ? 'upload' : 'arrowUpward')

	return (
		<Tag {...toRootProps(ref, state, [state.attrs, state.aria, state.dataset], forwardProps)}>
			<input
				className="so-file-upload__input"
				type="file"
				tabIndex={-1}
				aria-label={state.names_choose}
				accept={state.accept || undefined}
				name={state.name || undefined}
				form={state.form || undefined}
				multiple={state.multiple}
				required={state.required}
				disabled={state.disabled}
			/>
			<div className="so-file-upload__dropzone">
				<button
					className="so-file-upload__choose"
					type="button"
					aria-label={state.names_choose}
					disabled={state.disabled}
				>
					<span className="so-file-upload__symbol" aria-hidden="true">
						<UploadIcon />
					</span>
				</button>
				<div className="so-file-upload__prompt">
					{state.names_drop}{' '}
					<button
						className="so-file-upload__browse"
						type="button"
						disabled={state.disabled}
					>
						{state.names_browse}
					</button>
				</div>
				<div className="so-file-upload__hint">{state.names_hint}</div>
			</div>
			<div className="so-file-upload__message" role="status">
				{state.names_message}
			</div>
			{rows.length ? (
				<ul className="so-file-upload__list" role="list">
					{rows.map((row) => {
						const preview = state.native_previews?.[row.id]
						return (
							<li key={row.id} className="so-file-upload__item">
								<div className="so-file-upload__preview" aria-hidden="true">
									{preview ? (
										<img src={preview} alt="" />
									) : (
										<span>{row.extension}</span>
									)}
								</div>
								<div className="so-file-upload__details">
									<bdi>{row.file.name}</bdi>
									<span className="so-file-upload__size">{row.sizeText}</span>
								</div>
								<Button
									embedded="file-upload.remove"
									className="so-file-upload__remove"
									type="button"
									data-file-id={row.id}
									aria-label={row.removeLabel}
									disabled={state.disabled}
								>
									<Icon embedded="file-upload.remove-icon" tag={CLOSE} />
								</Button>
								{hasSlot(progress) ? (
									<div className="so-file-upload__progress">
										{renderSlot(progress, { file: row.file, id: row.id })}
									</div>
								) : null}
							</li>
						)
					})}
				</ul>
			) : null}
		</Tag>
	)
}
