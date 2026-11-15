<script>
	import {getContext,setContext} from 'svelte'
	import {Tabs} from '@soxa-ui/svelte'
	import {RUN,SCOPE,scopeOf} from './cross-plan.mjs'
	let {children,content} = $props()
	const run=getContext(RUN)
	const scope=scopeOf(run)
	setContext(SCOPE,scope)
</script>
{#if run.phase === 'scan'}{@render children?.()}{@render content?.()}{:else}<Tabs engine={scope.engine} {content}>{@render children?.()}</Tabs>{/if}
