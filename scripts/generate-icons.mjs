import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/icons', { recursive: true });
const source = 'public/brand/ACM_LOGO.png';
await sharp(source).resize(270, 270, { fit: 'inside' }).webp({ quality: 90 }).toFile('public/brand/acm-mark.webp');
await Promise.all([192, 512, 180].map(size => sharp(source).resize(size, size, { fit: 'contain', background: '#ffffff' }).png().toFile(`public/icons/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`)));
await sharp(source).resize(384, 384, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).extend({ top: 64, bottom: 64, left: 64, right: 64, background: '#ffffff' }).png().toFile('public/icons/maskable-512.png');
