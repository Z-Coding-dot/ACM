import { readFile } from 'node:fs/promises';
const css = await readFile('src/styles.css', 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{3,6})\s*;/gi)].map(m => [m[1], m[2]]));
function luminance(hex) { const rgb = hex.replace('#', ''); const normalized = rgb.length === 3 ? [...rgb].map(s => s + s).join('') : rgb; const values = [0, 2, 4].map(start => parseInt(normalized.slice(start, start + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return values[0] * .2126 + values[1] * .7152 + values[2] * .0722; }
const pairs = [['ink', 'surface'], ['muted', 'surface'], ['muted', 'canvas'], ['brand', 'surface'], ['brand', 'brand-soft'], ['warning', 'warning-soft'], ['info', 'info-soft'], ['danger', 'danger-soft']];
for (const [foreground, background] of pairs) { const f = luminance(tokens[foreground]), b = luminance(tokens[background]); const ratio = (Math.max(f, b) + .05) / (Math.min(f, b) + .05); console.log(`${foreground} on ${background}: ${ratio.toFixed(2)}:1`); if (ratio < 4.5) process.exitCode = 1; }
const control = (luminance(tokens.surface) + .05) / (luminance(tokens['control-border']) + .05); console.log(`control border on surface: ${control.toFixed(2)}:1`); if (control < 3) process.exitCode = 1;
