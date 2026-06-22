try {
  require('child_process').execSync('bun --version', { stdio: 'pipe' });
} catch {
  console.error('ERROR: Only bun is allowed. Run: bun install');
  process.exit(1);
}
