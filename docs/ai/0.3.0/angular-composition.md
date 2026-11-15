# Parts and scoped templates

Angular writes collection parts as separate attribute components; there is no dot syntax. Import the owner and each part. The Accordion example (`examples/angular/src/app/app.ts`) uses `<div so-accordion>` with `<div so-accordion-item value="help">`. The item joins its owner in document order.

Import SlotDirective for `<ng-template slot="header" let-selected="selected">`. The header context exposes selected, so the template displays Travel help: open/closed. Slot context names are the published contract; request api-angular-accordion-item rather than guessing from another adapter. Plain projected content is the body. A template is needed where the component passes scoped data or replaces its default rendering; use the exact slot name.

Select's items data has value/text pairs; the example binds an ordinary typed array and ngModel to the selected value. Options can alternatively be separate so-select-item parts. DatePicker owns its calendar and overlay: use its value and documented events instead of manually creating a parallel calendar. Portalled overlays appear under body in the browser; test the page rather than only descendants of the field host.

For Tabs, import TTabsComponent, TTabsItemComponent and TTabsContentComponent. Use so-tabs-item value="general", and so-tabs-content slot="content" value="general". A panel with `<ng-template slot="default">` creates heavy content when active and removes it on deactivation; ordinary projected components are created with the parent template. Read the generated Tabs records before using these optional components; the maintained executable recipe here uses Accordion.
