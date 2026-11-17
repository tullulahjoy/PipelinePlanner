import { createServer } from 'vite'

const server = await createServer({
  cacheDir: 'node_modules/.cache/vite-foundation-tests',
  server: { host: '127.0.0.1', port: 4175, strictPort: true },
})
await server.listen()
