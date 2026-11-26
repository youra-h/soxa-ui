import type { ElementType, ReactElement } from 'react'
import { hasSlot, renderSlot, toRootProps } from '../../adapter'
import { useSetupFileUpload } from './setup.component'
import type { FileUploadProps } from './base.component'

export function FileUpload(props: FileUploadProps): ReactElement | null {
	const { ref, forwardProps, state } = useSetupFileUpload(props)
	if (!state.rendered) return null

	const Tag = state.tag as ElementType
	const rows = state.names_rows ?? []
	const progress = props['item-progress']

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
				<span className="so-file-upload__symbol" aria-hidden="true">
					&#8593;
				</span>
				<button className="so-file-upload__choose" type="button" disabled={state.disabled}>
					{state.names_choose}
				</button>
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
								<button
									className="so-file-upload__remove"
									type="button"
									data-file-id={row.id}
									aria-label={row.removeLabel}
									disabled={state.disabled}
								>
									&times;
								</button>
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
