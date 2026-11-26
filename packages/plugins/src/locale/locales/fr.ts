import { freezeLocale } from '../locale'

/** Французский (Франция). */
export const frFR = freezeLocale({
	tag: 'fr-FR',
	translations: {
		fileUpload: {
			choose: 'Choisir des fichiers',
			drop: 'Glissez vos fichiers ici ou',
			browse: 'cliquez pour les ajouter',
			limit: 'Taille maximale du fichier : {size}',
			remove: 'Supprimer {name}',
			type: '{name} : type de fichier non pris en charge.',
			size: '{name} : fichier trop volumineux.',
			count: '{name} : nombre maximal de fichiers atteint.',
		},
		alertDialog: { confirm: 'Confirmer', cancel: 'Annuler' },
		alert: { close: 'Fermer' },
		codeBlock: {
			region: 'Code',
			copy: 'Copier',
			copied: 'Copié',
			error: 'Impossible de copier le code',
		},
		breadcrumbs: { navigation: 'Fil d’Ariane', overflow: 'Afficher les éléments masqués' },
		modal: { close: 'Fermer' },
		dialog: { maximize: 'Agrandir' },
		popover: { close: 'Fermer' },
		tabs: { close: 'Fermer {name}' },
		tags: { close: 'Fermer {name}' },
		toasts: { region: 'Notifications (F8)', close: 'Fermer {name}' },
		scroller: { prev: 'Défiler vers l’arrière', next: 'Défiler vers l’avant' },
		pagination: { prev: 'Page précédente', next: 'Page suivante' },
		field: { clear: 'Effacer {name}' },
		numberInput: { increment: 'Augmenter {name}', decrement: 'Diminuer {name}' },
		table: { selectAll: 'Tout sélectionner', sort: 'Trier par {name}' },
		calendar: {
			prevMonth: 'Mois précédent',
			nextMonth: 'Mois suivant',
			prevYear: 'Année précédente',
			nextYear: 'Année suivante',
			prevYears: '12 années précédentes',
			nextYears: '12 années suivantes',
		},
		datePicker: {
			trigger: 'Choisir une date',
			start: 'Date de début',
			end: 'Date de fin',
			confirm: 'OK',
			cancel: 'Annuler',
		},
		rating: {
			value: '{value} sur {max}',
			required: 'Veuillez choisir une note',
		},
		textarea: { counter: '{count} / {max}' },
	},
})
