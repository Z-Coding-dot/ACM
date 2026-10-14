import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/icons', { recursive: true });
// Transparent derivative; the owner's original artwork remains unchanged.
const source = await sharp('public/brand/acm-logo-transparent.png').trim().png().toBuffer();
await sharp(source).resize(270, 270, { fit: 'inside' }).webp({ quality: 90 }).toFile('public/brand/acm-mark.webp');
await Promise.all([192, 512, 180].map(size => sharp(source).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`public/icons/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`)));
// Installed maskable artwork needs an opaque canvas and a safe zone.
await sharp(source).resize(320, 320, { fit: 'contain', background: '#f7f8f6' }).flatten({ background: '#f7f8f6' }).extend({ top: 96, bottom: 96, left: 96, right: 96, background: '#f7f8f6' }).png().toFile('public/icons/maskable-512.png');
