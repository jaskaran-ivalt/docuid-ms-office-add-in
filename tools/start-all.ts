import { spawn, execSync } from 'node:child_process';
import { startDevServer, ROOT } from './dev-server';

const MANIFESTS = [
  { path: 'manifest.xml', app: 'Word', label: 'Word' },
  { path: 'manifest-excel.xml', app: 'Excel', label: 'Excel' },
  { path: 'manifest-powerpoint.xml', app: 'PowerPoint', label: 'PowerPoint' },
];

function enableDebugging(manifest: string) {
  try { execSync(`office-addin-dev-settings debugging ${manifest}`, { cwd: ROOT, stdio: 'pipe' }); } catch {}
}

function sideload(manifest: string, app: string) {
  try {
    execSync(`office-addin-dev-settings sideload "${manifest}" --app ${app}`, { cwd: ROOT, stdio: 'pipe', timeout: 30000 });
    console.log(`  ✅ ${app} sideloaded`);
  } catch (e: any) {
    console.log(`  ⚠️  ${app} sideload failed: ${e.message}`);
  }
}

async function main() {
  console.log('\n═══════════════════════════════════');
  console.log('  iVALT DocuID — All Versions');
  console.log('═══════════════════════════════════\n');

  console.log('🔧 Enabling debugging...');
  for (const m of MANIFESTS) enableDebugging(m.path);

  console.log('\n📦 Starting tsup watch...');
  const tsup = spawn('bunx', ['tsup', '--no-minify', '--sourcemap', '--watch'], {
    stdio: 'inherit', shell: true, cwd: ROOT,
  });

  await startDevServer();

  console.log('\n📎 Sideloading add-ins...');
  for (const m of MANIFESTS) sideload(m.path, m.app);

  console.log('\n═══════════════════════════════════');
  console.log('  All versions ready! Ctrl+C to stop');
  console.log('═══════════════════════════════════\n');

  const shutdown = () => { tsup.kill(); process.exit(); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
