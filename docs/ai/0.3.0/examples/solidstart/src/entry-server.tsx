import { createHandler, StartServer } from '@solidjs/start/server'
export default createHandler(() => (
	<StartServer
		document={(props) => (
			<html lang="en">
				<head>
					<meta charset="utf-8" />
					<title>SolidStart recipes</title>
					<link rel="icon" href="data:," />
					{props.assets}
				</head>
				<body>
					<div id="app">{props.children}</div>
					{props.scripts}
				</body>
			</html>
		)}
	/>
))
