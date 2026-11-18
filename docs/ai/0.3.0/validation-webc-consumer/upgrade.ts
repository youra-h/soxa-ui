import '@soxa-ui/webc'
import './setup'
requestAnimationFrame(() => {
	const output = document.getElementById('enhancement')
	if (output) output.textContent = 'Workshop draft enhanced'
})
