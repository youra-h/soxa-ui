import { freezeLocale } from '../locale'

/** Китайский (Китай, упрощённое письмо). */
export const zhCN = freezeLocale({
	tag: 'zh-CN',
	translations: {
		fileUpload: {
			choose: '选择文件',
			drop: '将文件拖放到此处或',
			browse: '点击上传',
			limit: '文件大小上限：{size}',
			remove: '移除 {name}',
			type: '{name}：不支持此文件类型。',
			size: '{name}：文件过大。',
			count: '{name}：已达到文件数量上限。',
		},
		alertDialog: { confirm: '确认', cancel: '取消' },
		alert: { close: '关闭' },
		codeBlock: { region: '代码', copy: '复制', copied: '已复制', error: '无法复制' },
		breadcrumbs: { navigation: '面包屑导航', overflow: '显示隐藏的导航项' },
		modal: { close: '关闭' },
		dialog: { maximize: '最大化' },
		popover: { close: '关闭' },
		tabs: { close: '关闭{name}' },
		tags: { close: '关闭{name}' },
		toasts: { region: '通知 (F8)', close: '关闭{name}' },
		scroller: { prev: '向前滚动', next: '向后滚动' },
		pagination: { prev: '上一页', next: '下一页' },
		field: { clear: '清除{name}' },
		numberInput: { increment: '增加{name}', decrement: '减少{name}' },
		table: { selectAll: '全选', sort: '按{name}排序' },
		calendar: {
			prevMonth: '上个月',
			nextMonth: '下个月',
			prevYear: '上一年',
			nextYear: '下一年',
			prevYears: '前 12 年',
			nextYears: '后 12 年',
		},
		datePicker: {
			trigger: '选择日期',
			start: '开始日期',
			end: '结束日期',
			confirm: '确定',
			cancel: '取消',
		},
		rating: {
			value: '{value} 分，满分 {max} 分',
			required: '请选择评分',
		},
		textarea: { counter: '{count} / {max}' },
	},
})
