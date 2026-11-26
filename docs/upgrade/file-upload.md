# FileUpload adoption

## Who is affected

Applications that select local files can adopt `FileUpload` in all six Soxa adapters.
Projects with custom locales can supply strings under `translations.fileUpload`.
Themes can style the FileUpload drop zone using the `data-dragging` attribute on its root.

## Before

A form can submit an attachment using its native file input.

```html
<form method="post" enctype="multipart/form-data">
  <input type="file" name="attachments" accept="image/*,.pdf" multiple />
  <button type="submit">Send</button>
</form>
```

## After

In Vue, import `FileUpload` from `@soxa-ui/vue` and use it with the same form attributes.

```vue
<form method="post" enctype="multipart/form-data">
  <FileUpload
    name="attachments"
    accept="image/*,.pdf"
    multiple
    :max-files="4"
    :max-file-size="10_000_000"
  />
  <button type="submit">Send</button>
</form>
```

The browser submits the accepted files under `attachments`. An app that sends files
programmatically can consume the `change:files` event and display app-managed progress
in the `item-progress` slot. Frameworks with scoped slots pass `file` and `id` to
this slot. The Web Components slot accepts a markup sample for each card.

Custom locales may omit the new section and use the component's built-in fallback.
Include the new key in application maps that enumerate every member of `TTranslations`.
The FileUpload root writes `data-dragging="true"` during a file drag and
`data-dragging="false"` at rest.

## Verification

Choose or drop files, inspect the result with `new FormData(form).getAll('attachments')`,
and remove one from the list. Form data should contain the remaining accepted files.
Run `npm run check:compatibility` after building the packages.
