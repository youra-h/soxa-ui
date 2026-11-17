import '@soxa-ui/webc'
import './setup'

// Parsed markup is upgraded after synchronous theme/icon registration.
requestAnimationFrame(() => {
	const status = document.getElementById('status')
	if (status) status.textContent = 'Enhanced in browser'
})
