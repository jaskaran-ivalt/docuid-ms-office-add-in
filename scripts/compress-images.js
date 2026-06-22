/**
 * One-time image compression script.
 * Run with: node scripts/compress-images.js
 *
 * Compresses all large PNGs in assets/ in-place.
 * Skips manifest icons (16, 32, 64, 80, 128) since those have required exact dimensions.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Files to skip — manifest icons must stay at exact pixel dimensions
const SKIP = ['icon-16.png', 'icon-32.png', 'icon-64.png', 'icon-80.png', 'icon-128.png'];

// Directories to scan
const DIRS = [
  path.join(ROOT, 'assets'),
  path.join(ROOT, 'assets', 'icons'),
  path.join(ROOT, 'src', 'taskpane', 'icons'),
];

async function compress(filePath) {
  const name = path.basename(filePath);
  if (SKIP.includes(name)) {
    console.log(`skip  ${path.relative(ROOT, filePath)} (manifest icon)`);
    return;
  }

  const before = fs.statSync(filePath).size;
  const meta = await sharp(filePath).metadata();

  await sharp(filePath)
    .png({ quality: 80, compressionLevel: 9, effort: 10 })
    .toBuffer()
    .then((buf) => fs.writeFileSync(filePath, buf));

  const after = fs.statSync(filePath).size;
  const saved = (((before - after) / before) * 100).toFixed(0);
  console.log(
    `ok    ${path.relative(ROOT, filePath)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB  (-${saved}%)  ${meta.width}x${meta.height}`
  );
}

async function main() {
  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
    for (const file of files) {
      await compress(path.join(dir, file));
    }
  }
  console.log('\ndone');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
