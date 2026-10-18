import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, isAbsolute, sep } from 'node:path';
import { createSharedHostingPackage, productionOrigin } from './lib/shared-hosting-package.mjs';

test('only canonical public HTTPS origins are accepted', () => {
  assert.equal(productionOrigin('https://acm.example.test/'), 'https://acm.example.test');
  for (const value of ['http://example.com', 'https://user:secret@example.com', 'https://example.com/app', 'https://example.com?q=x', 'https://example.com:8000', 'https://localhost', 'https://127.0.0.1']) {
    assert.throws(() => productionOrigin(value));
  }
});

test('release excludes private local data and creates empty runtime storage', async () => {
  const root = await mkdtemp(join(tmpdir(), 'acm-package-'));
  try {
    async function file(path, contents = 'source') { const full = join(root, path); await mkdir(join(full, '..'), { recursive: true }); await writeFile(full, contents); }
    for (const path of ['backend/artisan', 'backend/composer.json', 'backend/composer.lock', 'backend/bootstrap/app.php', 'backend/bootstrap/providers.php', 'backend/public/index.php', 'backend/app/Models/User.php', 'backend/database/migrations/example.php', 'dist/index.html', 'dist/assets/app.js', 'deploy/shared-hosting/backend.php', 'deploy/shared-hosting/.htaccess', 'deploy/shared-hosting/.user.ini', 'docs/DEPLOYMENT.md']) await file(path);
    await file('deploy/.env.example', 'APP_URL=https://example.com\nSANCTUM_STATEFUL_DOMAINS=example.com\nAPP_KEY=\nDB_PASSWORD=\n');
    for (const path of ['backend/.env', 'backend/storage/app/private/platform-owner-credentials.txt', 'backend/storage/app/private/business-logos/private.png', 'backend/storage/logs/laravel.log', 'backend/bootstrap/cache/config.php', 'backend/vendor/installed.php', 'backend/tests/secret.php', 'dist/credentials.txt']) await file(path, 'PRIVATE_LOCAL_VALUE');
    await mkdir(join(root, 'release'));
    const output = join(root, 'release', 'example');
    await createSharedHostingPackage(root, output, 'https://acm.example.test');
    const manifest = JSON.parse(await readFile(join(output, 'release-manifest.json'), 'utf8'));
    assert.equal(manifest.origin, 'https://acm.example.test');
    assert.equal(manifest.composerInstallRequired, true);
    for (const entry of manifest.files) assert.ok(!(await readFile(join(output, entry.path), 'utf8')).includes('PRIVATE_LOCAL_VALUE'), entry.path);
    assert.deepEqual(await readdir(join(output, 'acm-backend/storage/app/private')), []);
    assert.deepEqual(await readdir(join(output, 'acm-backend/bootstrap/cache')), []);
    assert.ok(manifest.files.some(file => file.path === 'public_html/.htaccess'));
    assert.ok((await readFile(join(output, 'acm-backend/.env.example'), 'utf8')).includes('APP_URL=https://acm.example.test'));
    await assert.rejects(createSharedHostingPackage(root, output, 'https://acm.example.test'));
    await assert.rejects(createSharedHostingPackage(root, join(root, 'outside'), 'https://acm.example.test'));
  } finally {
    const target = relative(tmpdir(), root);
    assert.ok(target.startsWith('acm-package-') && !target.includes(sep) && !isAbsolute(target));
    await rm(root, { recursive: true, force: true });
  }
});
