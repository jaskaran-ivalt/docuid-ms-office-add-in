import { execSync } from 'node:child_process';
import { ROOT } from './dev-server';

const manifests = ['manifest.xml', 'manifest-excel.xml', 'manifest-powerpoint.xml'];

for (const m of manifests) {
  try {
    execSync(`office-addin-debugging stop "${m}"`, { cwd: ROOT, stdio: 'pipe' });
    console.log(`  ✅ Stopped ${m}`);
  } catch {
    console.log(`  ⚠️  Could not stop ${m} (may not be running)`);
  }
}

console.log('\nAll debugging stopped.');
