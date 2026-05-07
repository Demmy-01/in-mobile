/**
 * compress-assets.js
 * Run: node scripts/compress-assets.js
 * Requires: npm install --save-dev sharp
 *
 * Compresses/resizes heavy images in the assets folder.
 */

const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\n❌  "sharp" is not installed. Run:\n\n    npm install --save-dev sharp\n\nthen try again.\n');
  process.exit(1);
}

const ASSETS = path.join(__dirname, '..', 'assets');

async function compressImage(src, dest, width, height, quality = 80) {
  const srcPath = path.join(ASSETS, src);
  const destPath = path.join(ASSETS, dest);

  const before = fs.statSync(srcPath).size;

  await sharp(srcPath)
    .resize(width, height, { fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(destPath);

  const after = fs.statSync(destPath).size;
  const saved = (((before - after) / before) * 100).toFixed(1);
  console.log(`✅  ${src}  →  ${dest}   ${(before / 1024).toFixed(0)}KB  →  ${(after / 1024).toFixed(0)}KB  (saved ${saved}%)`);
}

(async () => {
  console.log('\n🗜️  Compressing assets...\n');

  // Background: 1.76 MB PNG → compressed JPEG (phone screens are max 1080px wide)
  await compressImage('index-bg.png', 'index-bg.jpg', 1080, 1920, 75);

  // Onboarding images
  await compressImage('onboard-1.png', 'onboard-1.jpg', 828, 1200, 80);
  await compressImage('onboard-2.png', 'onboard-2.jpg', 828, 1200, 80);
  await compressImage('onboard-3.png', 'onboard-3.jpg', 828, 1200, 80);

  console.log('\n🎉  Done! Update your require() paths to use .jpg instead of .png\n');
})();
