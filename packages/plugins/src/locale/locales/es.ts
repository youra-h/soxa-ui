import { freezeLocale } from '../locale'

/** Испанский (Испания). Другой регион — `extendLocale(esES, { tag: 'es-MX' })`. */
export const esES = freezeLocale({
	tag: 'es-ES',
	translations: {
		fileUpload: {
			choose: 'Elegir archivos',
			drop: 'Arrastra tus archivos aquí o',
			browse: 'haz clic para subirlos',
			limit: 'Tamaño máximo del archivo: {size}',
			remove: 'Eliminar {name}',
			type: '{name}: tipo de archivo no compatible.',
			size: '{name}: archivo demasiado grande.',
			count: '{name}: se alcanzó el límite de archivos.',
		},
		alertDialog: { confirm: 'Confirmar', cancel: 'Cancelar' },
		alert: { close: 'Cerrar' },
		codeBlock: {
			region: 'Código',
			copy: 'Copiar',
			copied: 'Copiado',
			error: 'No se pudo copiar el código',
		},
		breadcrumbs: { navigation: 'Ruta de navegación', overflow: 'Mostrar elementos ocultos' },
		modal: { close: 'Cerrar' },
		dialog: { maximize: 'Maximizar' },
		popover: { close: 'Cerrar' },
		tabs: { close: 'Cerrar {name}' },
		tags: { close: 'Cerrar {name}' },
		toasts: { region: 'Notificaciones (F8)', close: 'Cerrar {name}' },
		scroller: { prev: 'Desplazar hacia atrás', next: 'Desplazar hacia adelante' },
		pagination: { prev: 'Página anterior', next: 'Página siguiente' },
		field: { clear: 'Borrar {name}' },
		numberInput: { increment: 'Aumentar {name}', decrement: 'Disminuir {name}' },
		table: { selectAll: 'Seleccionar todo', sort: 'Ordenar por {name}' },
		calendar: {
			prevMonth: 'Mes anterior',
			nextMonth: 'Mes siguiente',
			prevYear: 'Año anterior',
			nextYear: 'Año siguiente',
			prevYears: '12 años anteriores',
			nextYears: '12 años siguientes',
		},
		datePicker: {
			trigger: 'Elegir fecha',
			start: 'Fecha de inicio',
			end: 'Fecha de fin',
			confirm: 'Aceptar',
			cancel: 'Cancelar',
		},
		rating: {
			value: '{value} de {max}',
			required: 'Selecciona una valoración',
		},
		textarea: { counter: '{count} / {max}' },
	},
})
