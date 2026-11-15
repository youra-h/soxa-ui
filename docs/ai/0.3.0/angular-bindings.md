# Signals, model outputs and Angular Forms

The form source (`examples/angular/src/app/app.ts`) uses signals with OnPush; signals read in templates schedule zoneless updates. Use immutable application data and Angular bindings to update inputs. Do not write an adapter component's declared input field directly.

A writable input exposes its current value through valueChange: [(value)]="name" accepts a writable signal. The expanded spelling is [value]="name()" (valueChange)="name.set($event)". Ordinary events keep the so prefix: (soChangeValue) emits an object with oldValue and newValue, not a DOM Event and not the model value. (input) is the browser event on the native field. The checked Input simultaneously observes soChangeValue and drives its model without assigning state a second time.

Keep the declared union for outputs. DatePicker's TDatePickerValue includes range values even for a single-date configuration; import that public type from @soxa-ui/core. Do not cast away template errors. Boolean inputs accept disabled or [disabled]="true" / [disabled]="false", and undefined restores the default; disabled="false" and disabled="yes" are invalid strings.

Choose one state owner per control. Import FormsModule for [(ngModel)] (the Select example), or ReactiveFormsModule for [formControl]/formControlName (the email example). Do not also bind [(value)] on a Forms-managed control. In a parent form, give ngModel a name or mark it standalone using Angular's ngModelOptions.

User changes update the form; disable()/enable() reaches the control, and focus leaving the whole control sets touched. reset() on a nullable FormControl keeps null in the form and clears the UI to its descriptor default. A non-nullable FormControl resets to its initial value. Avoid a conflicting disabled input on a form-owned control.

Wrap fields in `<label so-label text="?">` for visible accessible names; import TLabelComponent. Select forwards attributes to its field. DatePicker is a group, so the example also supplies aria_label="Departure". Keep labels visible and test keyboard navigation; shared principles are in overview.
