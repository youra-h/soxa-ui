# FileUpload

Use FileUpload when a user needs to pick or drop local files. It is available in all six
adapters. Set `name` to include the accepted files in form data and use `required` when
the form needs at least one attachment.

```vue
<script setup lang="ts">
import { FileUpload } from '@soxa-ui/vue'
</script>

<template>
  <form action="/attachments" method="post" enctype="multipart/form-data">
    <FileUpload
      name="attachments"
      accept="image/*,.pdf"
      multiple
      :max-files="4"
      :max-file-size="10_000_000"
      required
    />
    <button type="submit">Send</button>
  </form>
</template>
```

`accept` lists eligible file types, `maxFiles` limits the count and `maxFileSize` limits
the size of one file in bytes. The `change:files` event reports changes to the accepted
selection, and `reject` reports rejected files. For application-managed transfers, read the
selection from `change:files` and show progress in the `item-progress` slot.

See the [generated API contract](../api/generated/contract.json) for the slot scope and
bindings and the [upgrade guide](../upgrade/file-upload.md) for form and locale details.
