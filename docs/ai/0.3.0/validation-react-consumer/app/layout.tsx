import type { ReactNode } from 'react'
import { Providers } from './providers'
import '@soxa-ui/theme-oren'
export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="data:," />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
