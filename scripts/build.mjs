import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

function copyIfExists(src, dest) {
  if (existsSync(src)) {
    const destDir = dirname(dest);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    copyFileSync(src, dest);
    console.log(`  ✓ ${src} → ${dest}`);
  }
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${srcPath} → ${destPath}`);
    }
  }
}

console.log('\n📦 Copying static assets to dist/...\n');

copyDir(join(ROOT, 'assets'), join(DIST, 'assets'));

copyIfExists(join(ROOT, 'src', 'taskpane', 'taskpane.html'), join(DIST, 'taskpane.html'));
copyIfExists(join(ROOT, 'src', 'commands', 'commands.html'), join(DIST, 'commands.html'));
copyIfExists(join(ROOT, 'src', 'taskpane', 'support.html'), join(DIST, 'support.html'));
copyIfExists(join(ROOT, 'src', 'taskpane', 'privacy-policy.html'), join(DIST, 'privacy-policy.html'));
copyIfExists(join(ROOT, 'src', 'taskpane', 'eula.html'), join(DIST, 'eula.html'));

copyIfExists(join(ROOT, 'manifest.xml'), join(DIST, 'manifest.xml'));
copyIfExists(join(ROOT, 'manifest-excel.xml'), join(DIST, 'manifest-excel.xml'));
copyIfExists(join(ROOT, 'manifest-powerpoint.xml'), join(DIST, 'manifest-powerpoint.xml'));
copyIfExists(join(ROOT, 'manifest-production.xml'), join(DIST, 'manifest-production.xml'));

// Dev manifests for localhost sideloading
copyIfExists(join(ROOT, 'manifest-dev.xml'), join(DIST, 'manifest-dev.xml'));
copyIfExists(join(ROOT, 'manifest-dev-excel.xml'), join(DIST, 'manifest-dev-excel.xml'));
copyIfExists(join(ROOT, 'manifest-dev-powerpoint.xml'), join(DIST, 'manifest-dev-powerpoint.xml'));

console.log('\n✅ Static assets copied to dist/\n');
