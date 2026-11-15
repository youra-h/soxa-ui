<script>
	import {setContext} from 'svelte'
	import {RUN} from './cross-plan.mjs'
	import Tree from './CrossSet.svelte'
	let {run,...props}=$props()
	setContext(RUN,(() => run)())
</script>
<Tree {...props}/>
