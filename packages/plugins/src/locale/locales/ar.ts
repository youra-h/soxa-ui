import { freezeLocale } from '../locale'

/**
 * Арабский (Египет). Египет, а не Саудовская Аравия: у `ar-SA` календарь Intl
 * по умолчанию исламский, а сетка календаря — григорианская.
 */
export const arEG = freezeLocale({
	tag: 'ar-EG',
	translations: {
		fileUpload: {
			choose: 'اختيار الملفات',
			drop: 'اسحب الملفات إلى هنا أو',
			browse: 'انقر للتحميل',
			limit: 'الحد الأقصى لحجم الملف: {size}',
			remove: 'إزالة {name}',
			type: '{name}: نوع الملف غير مدعوم.',
			size: '{name}: الملف كبير جدًا.',
			count: '{name}: تم بلوغ الحد الأقصى لعدد الملفات.',
		},
		alertDialog: { confirm: 'تأكيد', cancel: 'إلغاء' },
		alert: { close: 'إغلاق' },
		codeBlock: {
			region: 'الشيفرة',
			copy: 'نسخ',
			copied: 'تم النسخ',
			error: 'تعذّر نسخ الشيفرة',
		},
		breadcrumbs: { navigation: 'مسار التنقل', overflow: 'إظهار عناصر التنقل المخفية' },
		modal: { close: 'إغلاق' },
		dialog: { maximize: 'تكبير' },
		popover: { close: 'إغلاق' },
		tabs: { close: 'إغلاق {name}' },
		tags: { close: 'إغلاق {name}' },
		toasts: { region: 'الإشعارات (F8)', close: 'إغلاق {name}' },
		scroller: { prev: 'التمرير للخلف', next: 'التمرير للأمام' },
		pagination: { prev: 'الصفحة السابقة', next: 'الصفحة التالية' },
		field: { clear: 'مسح {name}' },
		numberInput: { increment: 'زيادة {name}', decrement: 'تقليل {name}' },
		table: { selectAll: 'تحديد الكل', sort: 'فرز حسب {name}' },
		calendar: {
			prevMonth: 'الشهر السابق',
			nextMonth: 'الشهر التالي',
			prevYear: 'السنة السابقة',
			nextYear: 'السنة التالية',
			prevYears: 'الـ 12 سنة السابقة',
			nextYears: 'الـ 12 سنة التالية',
		},
		datePicker: {
			trigger: 'اختيار التاريخ',
			start: 'تاريخ البدء',
			end: 'تاريخ الانتهاء',
			confirm: 'حسنًا',
			cancel: 'إلغاء',
		},
		rating: {
			value: '{value} من {max}',
			required: 'يُرجى اختيار تقييم',
		},
		textarea: { counter: '{count} / {max}' },
	},
})
