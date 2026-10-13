import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/icons', { recursive: true });
await Promise.all([192, 512, 180].map(size => sharp('public/icon.svg').resize(size).png().toFile(`public/icons/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`)));
await sharp('public/icon.svg').resize(384).flatten({ background: '#215a4a' }).extend({ top: 64, bottom: 64, left: 64, right: 64, background: '#215a4a' }).png().toFile('public/icons/maskable-512.png');
