const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.join(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const svgPath = path.join(assetsDir, 'app-icon.svg');
const pngPath = path.join(assetsDir, 'app-icon.png');
const icoPath = path.join(assetsDir, 'app-icon.ico');
const icnsPath = path.join(assetsDir, 'app-icon.icns');
const iconsetDir = path.join(assetsDir, 'app-icon.iconset');

if (process.platform !== 'darwin') {
  throw new Error('Icon asset generation currently requires macOS sips and iconutil.');
}

if (!fs.existsSync(svgPath)) {
  throw new Error(`Icon source not found: ${svgPath}`);
}

fs.rmSync(iconsetDir, { recursive: true, force: true });
fs.mkdirSync(iconsetDir, { recursive: true });

run('sips', ['-s', 'format', 'png', '-z', '1024', '1024', svgPath, '--out', pngPath]);

for (const icon of getIconsetTargets()) {
  run('sips', ['-z', String(icon.size), String(icon.size), pngPath, '--out', path.join(iconsetDir, icon.name)]);
}

fs.rmSync(icnsPath, { force: true });
run('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsPath]);

const icoPngs = [];
for (const size of [16, 32, 48, 64, 128, 256]) {
  const targetPath = path.join(assetsDir, `.app-icon-${size}.png`);
  run('sips', ['-z', String(size), String(size), pngPath, '--out', targetPath]);
  icoPngs.push({ size, bytes: fs.readFileSync(targetPath) });
}

fs.writeFileSync(icoPath, createIco(icoPngs));

for (const { size } of icoPngs) {
  fs.rmSync(path.join(assetsDir, `.app-icon-${size}.png`), { force: true });
}
fs.rmSync(iconsetDir, { recursive: true, force: true });

console.log(`Wrote ${path.relative(rootDir, pngPath)}`);
console.log(`Wrote ${path.relative(rootDir, icnsPath)}`);
console.log(`Wrote ${path.relative(rootDir, icoPath)}`);

function getIconsetTargets() {
  return [
    { name: 'icon_16x16.png', size: 16 },
    { name: 'icon_16x16@2x.png', size: 32 },
    { name: 'icon_32x32.png', size: 32 },
    { name: 'icon_32x32@2x.png', size: 64 },
    { name: 'icon_128x128.png', size: 128 },
    { name: 'icon_128x128@2x.png', size: 256 },
    { name: 'icon_256x256.png', size: 256 },
    { name: 'icon_256x256@2x.png', size: 512 },
    { name: 'icon_512x512.png', size: 512 },
    { name: 'icon_512x512@2x.png', size: 1024 },
  ];
}

function createIco(images) {
  const headerSize = 6;
  const directoryEntrySize = 16;
  const pixelDataOffset = headerSize + images.length * directoryEntrySize;
  const totalSize = pixelDataOffset + images.reduce((sum, image) => sum + image.bytes.length, 0);
  const buffer = Buffer.alloc(totalSize);

  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(images.length, 4);

  let imageOffset = pixelDataOffset;
  images.forEach((image, index) => {
    const entryOffset = headerSize + index * directoryEntrySize;
    buffer.writeUInt8(image.size === 256 ? 0 : image.size, entryOffset);
    buffer.writeUInt8(image.size === 256 ? 0 : image.size, entryOffset + 1);
    buffer.writeUInt8(0, entryOffset + 2);
    buffer.writeUInt8(0, entryOffset + 3);
    buffer.writeUInt16LE(1, entryOffset + 4);
    buffer.writeUInt16LE(32, entryOffset + 6);
    buffer.writeUInt32LE(image.bytes.length, entryOffset + 8);
    buffer.writeUInt32LE(imageOffset, entryOffset + 12);
    image.bytes.copy(buffer, imageOffset);
    imageOffset += image.bytes.length;
  });

  return buffer;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
