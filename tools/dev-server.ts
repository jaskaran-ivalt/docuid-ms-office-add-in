import { getHttpsServerOptions } from 'office-addin-dev-certs';
import { readFileSync, existsSync, watch } from 'node:fs';
import { createServer } from 'node:https';
import { join, extname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const PORT = 3000;
const DIST = join(import.meta.dirname, '..', 'dist-tsup');
const SRC = join(import.meta.dirname, '..', 'src');
const ROOT = join(import.meta.dirname, '..');
const BACKEND_URL = 'https://www.docuid.net';

const RELOAD_SCRIPT = `
<script>(function(){
  var es = new EventSource('/__reload');
  es.onmessage = function(e) {
    if (e.data === 'reload') location.reload();
  };
  es.onerror = function(){ es.close(); setTimeout(function(){
    var es2 = new EventSource('/__reload');
    es2.onmessage = arguments.callee;
    es2.onerror = function(){ es2.close(); };
  }, 2000); };
})();</script>`;

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

let reloadClients: ServerResponse[] = [];

function serveFile(res: ServerResponse, filePath: string) {
  const ext = extname(filePath);
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(content);
  return true;
}

function generateTaskpaneHtml(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>iVALT DocuID</title>
  <script type="text/javascript" src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
  <link rel="stylesheet" href="https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/office-ui-fabric-core/11.1.0/css/fabric.min.css" />
  <link href="/taskpane.css" rel="stylesheet" />
</head>
<body class="ms-font-m ms-Fabric">
  <div id="container"></div>
  <script src="/taskpane.global.js"></script>
  ${RELOAD_SCRIPT}
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
  ${RELOAD_SCRIPT}
</body>
</html>`;
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `https://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: connected\n\n');
    reloadClients.push(res);
    req.on('close', () => { reloadClients = reloadClients.filter((c) => c !== res); });
    return;
  }

  if (pathname.startsWith('/api/')) {
    let targetPath = pathname;
    if (pathname.startsWith('/api/docuid/biometric/'))
      targetPath = pathname.replace('/api/docuid/biometric', '/api/biometric');
    else if (pathname.startsWith('/api/docuid/documents/')) {
      if (/\/api\/docuid\/documents\/\d+\/(download|content)$/.test(pathname))
        targetPath = pathname.replace('/api/docuid/documents', '/api/documents');
      else targetPath = pathname.replace('/api/docuid/documents', '/api/dashboard/documents');
    } else if (pathname.startsWith('/api/docuid/shares/'))
      targetPath = pathname.replace('/api/docuid/shares', '/api/dashboard/shares');

    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await new Promise<Buffer>((r) => { const chunks: Buffer[] = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => r(Buffer.concat(chunks))); })
      : undefined;
    const proxyRes = await fetch(`${BACKEND_URL}${targetPath}${url.search}`, {
      method: req.method,
      headers: body ? { 'content-type': req.headers['content-type'] || '' } : {},
      body,
    });
    const proxyBody = await proxyRes.text();
    res.writeHead(proxyRes.status, Object.fromEntries(proxyRes.headers));
    res.end(proxyBody);
    return;
  }

  if (pathname.startsWith('/assets/') && serveFile(res, join(ROOT, pathname))) return;
  if (serveFile(res, join(DIST, pathname))) return;
  if (serveFile(res, join(DIST, pathname + '/index.html'))) return;

  if (pathname === '/taskpane.html' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateTaskpaneHtml());
    return;
  }

  if (pathname === '/commands.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateCommandsHtml());
    return;
  }

  for (const page of ['/privacy-policy.html', '/eula.html', '/support.html']) {
    if (pathname === page && serveFile(res, join(SRC, 'taskpane', page))) return;
  }

  res.writeHead(404);
  res.end('Not found');
}

export async function startDevServer() {
  console.log('🌐 Starting dev server...\n');

  const certs = await getHttpsServerOptions();
  const server = createServer({ key: certs.key, cert: certs.cert }, handler);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  // Watch dist-tsup for changes and notify SSE clients
  let reloadTimer: ReturnType<typeof setTimeout> | null = null;
  const triggerReload = () => {
    if (reloadTimer) return;
    reloadTimer = setTimeout(() => {
      reloadTimer = null;
      console.log('  ↻ Reloading add-in...');
      for (const client of reloadClients) client.write('data: reload\n\n');
    }, 200);
  };

  if (existsSync(DIST)) {
    watch(DIST, { recursive: true }, (_event, filename) => {
      if (filename && !filename.endsWith('.js') && !filename.endsWith('.css')) return;
      triggerReload();
    });
  }

  // Notify parent process (office-addin-debugging) that server is ready
  if (process.send) process.send('ready');

  return { server };
}

export { DIST, SRC, ROOT, PORT };
