<script lang="ts">
import Backdrop from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import SetupAlertDialog from './setup.component'

export default { ...SetupAlertDialog, inheritAttrs: false, components: { Backdrop, Button, Icon } }
</script>

<template>
	<teleport :to="target">
		<template v-if="rendered">
			<Backdrop
				:classes="backdropClasses"
				:visible="visible"
				:styles="layout_backdropStyles"
				:dataset="backdropDataset"
			/>
			<component
				:is="tag"
				ref="rootElement"
				v-show="visible"
				:class="classes"
				:style="layout_styles"
				tabindex="-1"
				v-bind="{ ...attrs, ...aria, ...dataset, ...dismiss_ownerAttribute, ...$attrs }"
			>
				<h2 class="so-alert-dialog__title" v-bind="titleAria"><slot name="title" /></h2>
				<div class="so-alert-dialog__body" v-bind="bodyAria"><slot /></div>
				<div class="so-alert-dialog__footer">
					<!-- Slot presence is significant: an explicitly empty footer removes all default actions. -->
					<slot
						v-if="$slots.footer"
						name="footer"
						:confirm="dialog.confirm"
						:cancel="dialog.cancel"
					/>
					<template v-else>
						<Button
							embedded="alert-dialog.cancel"
							type="button"
							class="so-alert-dialog__cancel"
							@click="dialog.cancel()"
							><slot name="cancel">{{ names_cancel }}</slot></Button
						>
						<Button
							embedded="alert-dialog.action"
							type="button"
							class="so-alert-dialog__action"
							@click="dialog.confirm()"
							><slot name="action">{{ names_confirm }}</slot></Button
						>
					</template>
				</div>
				<Button
					v-if="closable"
					embedded="alert-dialog.close"
					type="button"
					class="so-alert-dialog__close"
					@click="dialog.requestClose('button')"
					v-bind="closeAria"
				>
					<slot name="close-icon"
						><Icon embedded="alert-dialog.close-icon" :tag="closeIconTag"
					/></slot>
				</Button>
			</component>
		</template>
	</teleport>
</template>
