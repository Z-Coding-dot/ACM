import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { mkdir, writeFile, readdir, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
const url = process.env.ACM_AUDIT_URL || 'http://127.0.0.1:4174/login';
let chromePath = process.env.CHROME_PATH || chromium.executablePath();
try { await access(chromePath); } catch {
  const root = resolve(dirname(chromium.executablePath()), '../..');
  const folder = (await readdir(root)).filter(name => name.startsWith('chromium_headless_shell-')).sort().at(-1);
  if (!folder) throw new Error('Install Playwright Chromium or set CHROME_PATH.');
  chromePath = join(root, folder, process.platform === 'win32' ? 'chrome-headless-shell-win64/chrome-headless-shell.exe' : 'chrome-headless-shell-linux64/chrome-headless-shell');
}
const chrome = await launch({ chromePath, chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'] });
try {
  const result = await lighthouse(url, { port: chrome.port, output: ['json', 'html'], onlyCategories: ['performance', 'accessibility'], logLevel: 'error' });
  if (!result) throw new Error('Lighthouse did not return a result');
  await mkdir('docs/audits', { recursive: true });
  await writeFile('docs/audits/lighthouse-mobile.json', result.report[0]); await writeFile('docs/audits/lighthouse-mobile.html', result.report[1]);
  const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)]));
  console.log(JSON.stringify({ url: result.lhr.finalDisplayedUrl, scores, lighthouseVersion: result.lhr.lighthouseVersion, settings: result.lhr.configSettings, metrics: { FCP: result.lhr.audits['first-contentful-paint'].displayValue, LCP: result.lhr.audits['largest-contentful-paint'].displayValue, CLS: result.lhr.audits['cumulative-layout-shift'].displayValue } }, null, 2));
  if (scores.accessibility < 95 || scores.performance < 85) process.exitCode = 1;
} finally { await chrome.kill(); }
