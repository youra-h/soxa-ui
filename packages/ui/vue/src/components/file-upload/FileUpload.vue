<script lang="ts">
import SetupFileUpload from './setup.component'

export default { ...SetupFileUpload }
</script>

<template>
	<component
		ref="rootElement"
		:is="tag"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
		<input
			class="so-file-upload__input"
			type="file"
			tabindex="-1"
			:aria-label="names_choose"
			:accept="accept || undefined"
			:name="name || undefined"
			:form="form || undefined"
			:multiple="multiple"
			:required="required"
			:disabled="disabled"
		/>
		<div class="so-file-upload__dropzone">
			<span class="so-file-upload__symbol" aria-hidden="true">&#8593;</span>
			<button class="so-file-upload__choose" type="button" :disabled="disabled">
				{{ names_choose }}
			</button>
			<div class="so-file-upload__hint">{{ names_hint }}</div>
		</div>
		<div class="so-file-upload__message" role="status">{{ names_message }}</div>
		<ul v-if="names_rows?.length" class="so-file-upload__list" role="list">
			<li v-for="row in names_rows" :key="row.id" class="so-file-upload__item">
				<div class="so-file-upload__preview" aria-hidden="true">
					<img v-if="native_previews?.[row.id]" :src="native_previews[row.id]" alt="" />
					<span v-else>{{ row.extension }}</span>
				</div>
				<div class="so-file-upload__details">
					<bdi>{{ row.file.name }}</bdi>
					<span class="so-file-upload__size">{{ row.sizeText }}</span>
				</div>
				<button
					class="so-file-upload__remove"
					type="button"
					:data-file-id="row.id"
					:aria-label="row.removeLabel"
					:disabled="disabled"
				>
					&times;
				</button>
				<div v-if="$slots['item-progress']" class="so-file-upload__progress">
					<slot name="item-progress" :file="row.file" :id="row.id" />
				</div>
			</li>
		</ul>
	</component>
</template>
