import '../../node_modules/@angular/material/prebuilt-themes/azure-blue.css'
import { Component, Directive, effect, input, signal } from '@angular/core'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSortModule, type Sort } from '@angular/material/sort'
import { MatTableModule } from '@angular/material/table'
import { TTableCollectionFacade, type ITableRow, type TTableRecord } from '@soxa-ui/core'
import { COLUMNS, type TRec } from '../data'

export const sel = {
	selectAll: 'thead mat-checkbox input[type="checkbox"]',
	sort: 'thead th.mat-column-name',
}

const allCheckbox =
	'' +
	'<mat-checkbox (change)="toggleAllRows()" [checked]="allSelected()" ' +
	'[indeterminate]="partlySelected()" aria-label="Выбрать все" />'
const rowCheckbox =
	'' +
	'<mat-checkbox (click)="$event.stopPropagation()" (change)="toggleRow(row)" ' +
	'[checked]="isSelected(row)" aria-label="Выбрать строку" />'

// Keep sort and selection in the Soxa collection, with one view update per action.
@Directive()
abstract class SoxaTableCore {
	readonly rows = input.required<TRec[]>()
	protected readonly columns = COLUMNS
	protected readonly displayed = ['select', ...COLUMNS.map(({ field }) => field)]
	protected readonly shown = signal<readonly ITableRow[]>([])
	private readonly facade = new TTableCollectionFacade({
		mode: 'multiple',
		trackBy: ({ data }) => (data as TRec | undefined)?.id,
		columns: COLUMNS.map((column) => ({
			...column,
			sortable: true,
			compare: (left: TTableRecord, right: TTableRecord) => {
				const a = (left as TRec)[column.field]
				const b = (right as TRec)[column.field]
				return a === b ? 0 : a > b ? 1 : -1
			},
		})),
	})
	private readonly selectionRevision = signal(0)
	protected readonly trackById = (_: number, row: ITableRow) => row.uid

	constructor() {
		effect(() => {
			this.facade.items = this.rows().map((data) => ({ data }))
			this.shown.set(this.facade.shown)
		})
	}

	protected sortBy(sort: Sort) {
		this.facade.sort = sort.direction ? [{ field: sort.active, direction: sort.direction }] : []
		this.shown.set(this.facade.shown)
	}

	protected cellValue(row: ITableRow, field: string) {
		return (row.data as TRec)[field]
	}

	protected isSelected(row: ITableRow) {
		this.selectionRevision()
		return this.facade.extensions.selection.isSelected(row)
	}

	protected allSelected() {
		this.selectionRevision()
		return this.facade.shownSelection === 'all'
	}

	protected partlySelected() {
		this.selectionRevision()
		return this.facade.shownSelection === 'some'
	}

	protected toggleRow(row: ITableRow) {
		this.facade.extensions.selection.toggle(row)
		this.selectionRevision.update((revision) => revision + 1)
	}

	protected toggleAllRows() {
		if (this.allSelected()) this.facade.deselectShown()
		else this.facade.selectShown()
		this.selectionRevision.update((revision) => revision + 1)
	}
}

@Component({
	selector: 'bench-soxa-direct',
	imports: [MatCheckboxModule, MatSortModule],
	styles: [
		'table { width: 100%; border-spacing: 0; } td, th { padding: 0 16px; height: 52px; text-align: start; }',
	],
	template: `
		<table role="table" matSort (matSortChange)="sortBy($event)">
			<thead>
				<tr>
					<th>${allCheckbox}</th>
					@for (c of columns; track c.field) {
						<th [class]="'mat-column-' + c.field" [mat-sort-header]="c.field">
							{{ c.text }}
						</th>
					}
				</tr>
			</thead>
			<tbody>
				@for (row of shown(); track row.uid) {
					<tr>
						<td>${rowCheckbox}</td>
						@for (c of columns; track c.field) {
							<td>{{ cellValue(row, c.field) }}</td>
						}
					</tr>
				}
			</tbody>
		</table>
	`,
})
export class DirectBench extends SoxaTableCore {}

@Component({
	selector: 'bench-soxa-material-renderer',
	imports: [MatTableModule, MatCheckboxModule, MatSortModule],
	template: `
		<table
			mat-table
			[dataSource]="shown()"
			[trackBy]="trackById"
			matSort
			(matSortChange)="sortBy($event)"
		>
			<ng-container matColumnDef="select">
				<th mat-header-cell *matHeaderCellDef>${allCheckbox}</th>
				<td mat-cell *matCellDef="let row">${rowCheckbox}</td>
			</ng-container>
			@for (c of columns; track c.field) {
				<ng-container [matColumnDef]="c.field">
					<th mat-header-cell *matHeaderCellDef mat-sort-header>{{ c.text }}</th>
					<td mat-cell *matCellDef="let row">{{ cellValue(row, c.field) }}</td>
				</ng-container>
			}
			<tr mat-header-row *matHeaderRowDef="displayed"></tr>
			<tr mat-row *matRowDef="let row; columns: displayed"></tr>
		</table>
	`,
})
export class MaterialRendererBench extends SoxaTableCore {}
