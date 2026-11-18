import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Fixture } from './react-fixture'
import { install } from './client'
install((element, spec) => {
	const root = createRoot(element)
	flushSync(() => root.render(<Fixture spec={spec} />))
	return () => flushSync(() => root.unmount())
})
