// Local stand-in for `vercel dev`: serves the static site and routes /api/* to the
// serverless handlers in api/, so the Fall Risk Check can be exercised end to end
// without a deploy.
//
//   node scripts/dev-server.mjs [port]
//
// The handlers are written as ESM but the project has no package.json, so Node would
// otherwise parse them as CommonJS. They are copied to .devtmp/*.mjs — one directory
// deep, exactly like api/, so the `../data/...` lookups in them still resolve.
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, copyFile, rm } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TMP = join(ROOT, '.devtmp');
const PORT = Number(process.argv[2]) || 8325;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};

const routes = new Map();
await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
for (const file of await readdir(join(ROOT, 'api'))) {
  if (!file.endsWith('.js')) continue;
  const name = file.replace(/\.js$/, '');
  const shim = join(TMP, `${name}.mjs`);
  await copyFile(join(ROOT, 'api', file), shim);
  routes.set(`/api/${name}`, (await import(pathToFileURL(shim))).default);
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const handler = routes.get(url.pathname);

  if (handler) {
    const query = Object.fromEntries(url.searchParams);
    const shim = {
      statusCode: 200,
      setHeader: (k, v) => res.setHeader(k, v),
      status(code) { this.statusCode = code; return this; },
      json(body) {
        res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
        return this;
      }
    };
    try {
      await handler({ method: req.method, query, url: req.url }, shim);
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const path = join(ROOT, rel === '/' ? 'index.html' : rel);
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`MEND dev server on http://localhost:${PORT}`));
