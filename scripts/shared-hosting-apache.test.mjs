import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, copyFile, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const apacheRoot = process.env.ACM_APACHE_ROOT || 'C:/xampp/apache';
const phpRoot = process.env.ACM_PHP_ROOT || 'C:/xampp/php';
const binary = join(apacheRoot, 'bin/httpd.exe');
const available = process.platform === 'win32' && existsSync(binary) && existsSync(join(phpRoot, 'php8apache2_4.dll'));

test('Apache serves SPA routes, dispatches backend methods and blocks private files', { skip: available ? false : 'Optional integration check requires Windows XAMPP Apache/PHP modules.', timeout: 45000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'acm-apache-'));
  const source = fileURLToPath(new URL('../deploy/shared-hosting/', import.meta.url));
  let child;
  const apachePath = path => path.replaceAll('\\', '/');
  const config = join(root, 'httpd.conf');
  try {
    const publicRoot = join(root, 'public_html'), backend = join(root, 'acm-backend');
    for (const directory of [publicRoot, join(publicRoot, 'assets'), join(backend, 'public'), join(backend, 'vendor'), join(backend, 'bootstrap')]) await mkdir(directory, { recursive: true });
    for (const file of ['.htaccess', 'backend.php']) await copyFile(join(source, file), join(publicRoot, file));
    await writeFile(join(publicRoot, 'index.html'), 'ACM_FRONTEND_SHELL');
    await writeFile(join(publicRoot, 'assets', 'test-abc123.js'), 'console.log("asset");');
    await writeFile(join(publicRoot, '.env'), 'PRIVATE_TEST_VALUE');
    await writeFile(join(backend, 'vendor/autoload.php'), '<?php');
    await writeFile(join(backend, 'bootstrap/app.php'), '<?php');
    await writeFile(join(backend, 'public/index.php'), '<?php header("Content-Type: application/json"); echo json_encode(["uri"=>$_SERVER["REQUEST_URI"],"method"=>$_SERVER["REQUEST_METHOD"],"csrf"=>$_SERVER["HTTP_X_XSRF_TOKEN"]??null]);');
    const listener = createServer();
    await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    await writeFile(config, `ServerRoot "${apachePath(apacheRoot)}"
Listen 127.0.0.1:${port}
ServerName 127.0.0.1
PidFile "${apachePath(join(root, 'httpd.pid'))}"
ErrorLog "${apachePath(join(root, 'error.log'))}"
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule dir_module modules/mod_dir.so
LoadModule mime_module modules/mod_mime.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
LoadModule php_module "${apachePath(join(phpRoot, 'php8apache2_4.dll'))}"
PHPIniDir "${apachePath(phpRoot)}"
TypesConfig conf/mime.types
AddHandler application/x-httpd-php .php
DocumentRoot "${apachePath(publicRoot)}"
<Directory "${apachePath(publicRoot)}">
AllowOverride All
Require all granted
</Directory>
`);
    const syntax = spawnSync(binary, ['-t', '-f', config], { encoding: 'utf8', windowsHide: true });
    assert.equal(syntax.status, 0, syntax.stderr || syntax.error?.message);
    child = spawn(binary, ['-X', '-f', config], { windowsHide: true, stdio: 'ignore' });
    const origin = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { ready = (await fetch(origin, { signal: AbortSignal.timeout(300) })).ok; if (ready) break; } catch { /* Wait for the isolated test listener only. */ }
      await delay(100);
    }
    assert.ok(ready, 'Isolated Apache did not start.');
    for (const path of ['/', '/login', '/app/settings', '/platform/account', '/reset-password?token=fixture']) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(await response.text(), 'ACM_FRONTEND_SHELL', path);
      assert.match(response.headers.get('cache-control'), /no-cache/);
    }
    for (const [method, path] of [['GET', '/health/ready'], ['GET', '/up'], ['GET', '/api/v1/not-a-route'], ['GET', '/sanctum/csrf-cookie'], ['GET', '/auth/google/callback?code=fixture'], ['GET', '/email/verify/1/hash?signature=fixture'], ['PUT', '/api/v1/auth/password'], ['POST', '/api/v1/business/logo']]) {
      const response = await fetch(`${origin}${path}`, { method, headers: { 'X-XSRF-TOKEN': 'fixture-csrf' } });
      assert.equal(response.status, 200, path);
      assert.deepEqual(await response.json(), { uri: path, method, csrf: 'fixture-csrf' });
      assert.match(response.headers.get('cache-control'), /no-store/);
      assert.equal(response.headers.get('x-powered-by'), null);
    }
    for (const path of ['/.env', '/backend/.env', '/storage/private.png', '/vendor/autoload.php', '/anything.php']) assert.equal((await fetch(`${origin}${path}`)).status, 403, path);
    assert.equal((await fetch(`${origin}/assets/missing.js`)).status, 404);
    const asset = await fetch(`${origin}/assets/test-abc123.js`);
    assert.match(asset.headers.get('cache-control'), /immutable/);
    assert.equal(asset.headers.get('x-content-type-options'), 'nosniff');
    await unlink(join(backend, 'vendor/autoload.php'));
    const incomplete = await fetch(`${origin}/api/v1/me`);
    assert.equal(incomplete.status, 503);
    assert.deepEqual(await incomplete.json(), { message: 'Application setup is incomplete.' });
  } finally {
    if (child) {
      spawnSync(binary, ['-k', 'shutdown', '-f', config], { windowsHide: true, stdio: 'ignore', timeout: 5000 });
      if (child.exitCode === null) child.kill();
      await delay(200);
    }
    const target = relative(tmpdir(), root);
    assert.ok(target.startsWith('acm-apache-') && !target.includes(sep) && !isAbsolute(target));
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
