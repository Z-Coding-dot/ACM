import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const existing = await readFile('backend/.env', 'utf8').catch(() => '');
const values = Object.fromEntries(existing.split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
let environment = await readFile('backend/.env.example', 'utf8');
for (const key of ['APP_KEY', 'DB_PASSWORD', 'MYSQL_ROOT_PASSWORD', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
  const value = values[key] || (key === 'APP_KEY' ? `base64:${randomBytes(32).toString('base64')}` : ['DB_PASSWORD', 'MYSQL_ROOT_PASSWORD'].includes(key) ? randomBytes(32).toString('hex') : '');
  environment = environment.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
}
await writeFile('backend/.env', environment, { mode: 0o600 });
const isolated = environment.replace(/^GOOGLE_CLIENT_ID=.*$/m, 'GOOGLE_CLIENT_ID=').replace(/^GOOGLE_CLIENT_SECRET=.*$/m, 'GOOGLE_CLIENT_SECRET=');
await writeFile('backend/.env.testing', isolated.replace(/^APP_ENV=.*$/m, 'APP_ENV=testing').replace(/^DB_DATABASE=.*$/m, 'DB_DATABASE=acm_test').replace(/^MAIL_MAILER=.*$/m, 'MAIL_MAILER=array'), { mode: 0o600 });
await writeFile('backend/.env.browser', isolated.replace(/^APP_ENV=.*$/m, 'APP_ENV=browser').replace(/^DB_DATABASE=.*$/m, 'DB_DATABASE=acm_e2e_test').replace(/^APP_URL=.*$/m, 'APP_URL=http://127.0.0.1:8001').replace(/^FRONTEND_URL=.*$/m, 'FRONTEND_URL=http://127.0.0.1:5174').replace(/^SESSION_COOKIE=.*$/m, 'SESSION_COOKIE=acm_browser_session').replace(/^GOOGLE_REDIRECT_URI=.*$/m, 'GOOGLE_REDIRECT_URI=http://127.0.0.1:8001/auth/google/callback'), { mode: 0o600 });
console.log('Local Laravel/MySQL environment prepared. Secrets were generated privately; none were printed.');
