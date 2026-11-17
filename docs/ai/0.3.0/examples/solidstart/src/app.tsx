import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import './setup'
export default function App() {
	return (
		<Router>
			<FileRoutes />
		</Router>
	)
}
