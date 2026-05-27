import { getHttpsServerOptions } from 'office-addin-dev-certs';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:https';
import { spawn } from 'node:child_process';
import { join, extname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const PORT = 3000;
const DIST = join(import.meta.dirname, '..', 'dist-tsup');
const SRC = join(import.meta.dirname, '..', 'src');
const ROOT = join(import.meta.dirname, '..');

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const BACKEND_URL = 'https://www.docuid.net';

function serveFile(res: ServerResponse, filePath: string) {
  const ext = extname(filePath);
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(content);
  return true;
}

function generateHtml(title: string, scripts: string[], styles: string[] = []): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script type="text/javascript" src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
  <link rel="stylesheet" href="https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/office-ui-fabric-core/11.1.0/css/fabric.min.css" />
  ${styles.map((s) => `<link href="${s}" rel="stylesheet" />`).join('\n  ')}
</head>
<body class="ms-font-m ms-Fabric">
  <div id="container"></div>
  ${scripts.map((s) => `<script src="${s}"></script>`).join('\n  ')}
</body>
</html>`;
}

function generateCommandsHtml(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <script type="text/javascript" src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
</head>
<body>
  <script src="/commands.global.js"></script>
</body>
</html>`;
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `https://localhost:${PORT}`);
  const pathname = url.pathname;

  // API proxy
  if (pathname.startsWith('/api/')) {
    const proxyReq = await fetch(`${BACKEND_URL}${pathname}${url.search}`, {
      method: req.method,
      headers: { 'content-type': req.headers['content-type'] || '' },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await new Promise<Buffer>((r) => { const chunks: Buffer[] = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => r(Buffer.concat(chunks))); }) : undefined,
    });
    const body = await proxyReq.text();
    res.writeHead(proxyReq.status, Object.fromEntries(proxyReq.headers));
    res.end(body);
    return;
  }

  // Asset files from project root
  if (pathname.startsWith('/assets/')) {
    if (serveFile(res, join(ROOT, pathname))) return;
  }

  // Static files from dist-tsup
  if (serveFile(res, join(DIST, pathname))) return;
  if (serveFile(res, join(DIST, pathname + '/index.html'))) return;

  // HTML pages
  if (pathname === '/taskpane.html' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateHtml('iVALT DocuID', ['/taskpane.global.js'], ['/taskpane.css']));
    return;
  }

  if (pathname === '/commands.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateCommandsHtml());
    return;
  }

  // Static HTML pages (privacy-policy, eula, support)
  const staticPages = ['/privacy-policy.html', '/eula.html', '/support.html'];
  if (staticPages.includes(pathname)) {
    const srcPath = join(SRC, 'taskpane', pathname);
    if (serveFile(res, srcPath)) return;
  }

  res.writeHead(404);
  res.end('Not found');
}

async function main() {
  console.log('\n🔧 Starting tsup watch + dev server...\n');

  // Start tsup --watch
  const tsup = spawn('bunx', ['tsup', '--no-minify', '--sourcemap', '--watch'], {
    stdio: 'inherit',
    shell: true,
    cwd: ROOT,
  });

  // Start HTTPS server
  const certs = await getHttpsServerOptions();
  const server = createServer({ key: certs.key, cert: certs.cert }, handler);

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`\n✅ Dev server running at https://localhost:${PORT}\n`);

  // Notify parent process (office-addin-debugging) that server is ready
  if (process.send) process.send('ready');

  // Graceful shutdown
  const shutdown = () => { tsup.kill(); server.close(); process.exit(); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
