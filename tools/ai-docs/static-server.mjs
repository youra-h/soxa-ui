import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const directory = resolve('dist/app/browser')
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' }
const server = createServer(async (request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname
	const file = resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname))
	if (!file.startsWith(directory + sep)) {
		response.writeHead(403).end()
		return
	}
	try {
		response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
		response.end(await readFile(file))
	} catch {
		response.writeHead(404).end()
	}
})
server.listen(0, '127.0.0.1', () => {
	console.log('http://127.0.0.1:' + server.address().port)
})
