import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8765);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.vtt': 'text/vtt; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/xapi') return json(res, 200, { ok: true, stored: false, test: true });
  if (url.pathname === '/api/completion-check') return json(res, 200, { ok: true, completed: false, test: true });
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method_not_allowed' });

  const requested = decodeURIComponent(
    url.pathname === '/' ? '/index.html' :
    (url.pathname === '/app' || url.pathname === '/app/') ? '/index.html' :
    url.pathname
  );
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(file);
  // Playwright may close a response while navigating rapidly between pages.
  // Swallow that expected disconnect so one aborted asset cannot terminate the
  // shared static server halfway through the suite.
  stream.on('error', (error) => {
    if (res.headersSent) return res.destroy();
    res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(error.code === 'ENOENT' ? 'Not found' : 'Read error');
  });
  res.on('error', () => {});
  stream.pipe(res);
});

server.on('clientError', (error, socket) => socket.destroy());
server.on('error', (error) => {
  console.error(`TeachPlay test server error: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`TeachPlay test server listening on http://127.0.0.1:${port}`));
