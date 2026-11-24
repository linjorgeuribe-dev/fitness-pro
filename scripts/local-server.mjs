// Sirve dist/ + /api con Postgres embebido. Solo para desarrollo y e2e: `node scripts/local-server.mjs [puerto]`.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { handle } from '../server/core.ts'
import { memoryDb } from '../server/pglite-db.ts'

const port = Number(process.argv[2] ?? 4173), root = new URL('../dist/', import.meta.url).pathname
const db = await memoryDb()
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' }

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname.startsWith('/api/')) {
    const chunks = []; for await (const c of req) chunks.push(c)
    const r = await handle(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), { db, ip: req.socket.remoteAddress ?? 'local', secure: false })
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text()); return
  }
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  for (const f of [join(root, path), join(root, 'index.html')]) {
    try { const data = await readFile(f); res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }); res.end(data); return } catch { /* siguiente */ }
  }
  res.writeHead(404); res.end()
}).listen(port, () => console.log(`http://localhost:${port}`))
