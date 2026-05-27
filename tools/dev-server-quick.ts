import { spawn } from 'node:child_process';
import { startDevServer, ROOT } from './dev-server';

async function main() {
  console.log('\n🔧 Starting tsup watch + dev server...\n');

  const tsup = spawn('bunx', ['tsup', '--no-minify', '--sourcemap', '--watch'], {
    stdio: 'inherit', shell: true, cwd: ROOT,
  });

  const { server } = await startDevServer();

  console.log(`✅ Dev server running at https://localhost:3000`);

  const shutdown = () => { tsup.kill(); server.close(); process.exit(); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
