import { createReadStream, existsSync, statSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const backend = new URL(process.env.API_BACKEND || 'http://127.0.0.1:3001');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  const ext = extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
}

function proxyToBackend(req, res) {
  const options = {
    hostname: backend.hostname,
    port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: backend.host,
    },
  };

  const proxyReq = httpRequest(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('API proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'API unavailable. Is the backend running on port 3001?' }));
  });

  req.pipe(proxyReq);
}

const server = createServer((req, res) => {
  const rawUrl = req.url || '/';

  if (rawUrl.startsWith('/api')) {
    proxyToBackend(req, res);
    return;
  }

  const urlPath = decodeURIComponent(rawUrl.split('?')[0]);
  let filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  const indexPath = join(distDir, 'index.html');
  if (existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found. Run: npm run build');
});

if (!existsSync(distDir)) {
  console.error('Missing dist/ folder. Run: npm run build');
  process.exit(1);
}

server.listen(port, host, () => {
  console.log(`foody admin running on http://${host}:${port}`);
  console.log(`API proxy -> ${backend.origin}`);
});
