<script lang="ts">
import Backdrop from '../../adapter/backdrop/Backdrop'
import Icon from '../icon/Icon.vue'
import Button from '../button/Button.vue'
import SetupGuide from './setup.component'

export default { ...SetupGuide, inheritAttrs: false, components: { Backdrop, Button, Icon } }
</script>

<template>
	<teleport :to="target">
		<div
			v-if="rendered && visible && (backdropRendered || position_spotlight)"
			class="so-guide__decoration"
			:style="position_layer"
			aria-hidden="true"
		>
			<Backdrop
				v-if="backdropRendered"
				visible
				:classes="backdropClasses"
				:styles="position_backdrop"
			/>
			<div
				v-if="position_spotlight"
				class="so-guide__spotlight"
				:style="position_spotlight"
			/>
		</div>
		<component
			:is="tag"
			v-if="rendered"
			v-show="visible"
			ref="rootElement"
			:class="classes"
			:style="layout_styles"
			tabindex="-1"
			v-bind="{ ...attrs, ...aria, ...dataset, ...$attrs }"
		>
			<template v-if="step">
				<div class="so-guide__content" aria-live="polite">
					<p class="so-guide__progress">{{ names_labels?.progress }}</p>
					<h2 class="so-guide__title">{{ step.title }}</h2>
					<p v-if="step.description" class="so-guide__description">
						{{ step.description }}
					</p>
				</div>
				<div class="so-guide__actions">
					<Button
						type="button"
						embedded="guide.previous"
						:disabled="stepNumber <= 1"
						@click="guide.previous()"
						>{{ names_labels?.previous }}</Button
					>
					<Button type="button" embedded="guide.next" @click="guide.next()">
						{{ names_labels?.forward }}
					</Button>
				</div>
				<Button
					v-if="closable"
					type="button"
					embedded="guide.close"
					class="so-guide__close"
					:aria_label="names_labels?.close"
					@click="guide.requestClose('button')"
				>
					<Icon embedded="guide.close-icon" :tag="closeIcon" />
				</Button>
			</template>
		</component>
	</teleport>
</template>
