# Release-specific mistakes and limits

- Do not use bind:value on Input: 0.3.0 declares only ref bindable there.
- Do not read callback.target.value from onChangeValue; read newValue/oldValue.
- Do not treat bind:ref as the nested input or bind:this as the controller.
- Do not place mutable state/controllers at module scope in SvelteKit.
- Do not mix current development API or newer packages into the 0.3.0 recipe.
- Do not assume compound markup options and ordinary portals exist during SSR.
- Do not rename hyphenated snippet keys, duplicate theme state, or write DOM
  input values alongside the controlled application value.

The published Teleport.svelte.d.ts self-imports Teleport and also declares that
name. With skipLibCheck=false, TypeScript reports TS2440; svelte-check 4.7.7
reports one library error and zero warnings. Reproduced with TypeScript 6.0.3
and 5.9.3. This blocks a fully passing strict typed example for exact 0.3.0.
Keep the diagnostic command failing; do not silence declarations or modify
node_modules. A future patched release needs its own versioned records.

Runtime success does not make this type failure pass. Two bounded ARIA limits
are also recorded in svelte-sveltekit and validation. General accessibility,
theme authoring and plugin extension guides remain outside this small recipe.
