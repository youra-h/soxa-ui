# Release-specific mistakes and limits

- Do not use bind:value on Input: 0.4.2 declares only ref bindable there.
- Do not read callback.target.value from onChangeValue; read newValue/oldValue.
- Do not treat bind:ref as the nested input or bind:this as the controller.
- Do not place mutable state/controllers at module scope in SvelteKit.
- Do not mix current development API or newer packages into the 0.4.2 recipe.
- Do not assume compound markup options and ordinary portals exist during SSR.
- Do not rename hyphenated snippet keys, duplicate theme state, or write DOM
  input values alongside the controlled application value.

The Teleport declaration conflict from 0.3.0 is fixed in 0.4.2. Keep strict
library checking enabled; do not patch node_modules. The published-package smoke
requires valid SSR and hydrated/open/closed popup references, including after
route navigation. This sample does not establish complete component coverage.
