<template>
	<div class="so-file-upload">
		<input class="so-file-upload__input" type="file" />
		<div class="so-file-upload__dropzone">
			<span class="so-file-upload__symbol">&#8593;</span>
			<button class="so-file-upload__choose" type="button">Choose files</button>
			<div class="so-file-upload__hint">Drag files here</div>
		</div>
		<div class="so-file-upload__message"></div>
		<ul class="so-file-upload__list">
			<li class="so-file-upload__item">
				<div class="so-file-upload__preview">FIG</div>
				<div class="so-file-upload__details">
					design.fig
					<span class="so-file-upload__size">2 MB</span>
				</div>
				<button class="so-file-upload__remove" type="button">&times;</button>
				<div class="so-file-upload__progress"><slot name="item-progress" /></div>
			</li>
		</ul>
	</div>
</template>
