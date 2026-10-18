import { copyFile, mkdir, readdir, readFile, lstat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, relative, sep, isAbsolute } from 'node:path';

export function productionOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.port || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Supply a canonical HTTPS origin without a path, port or credentials.');
  }
  return url.origin;
}

// Copy application source explicitly. Local .env, storage, vendor, tests, caches,
// credential files and database dumps are never used as package inputs.
async function copySource(source, target) {
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error('Release inputs must not contain symbolic links.');
  if (info.isDirectory()) {
    await mkdir(target, { recursive: true });
    for (const name of await readdir(source)) {
      if (!name.startsWith('.') && !['node_modules', 'vendor'].includes(name)) await copySource(join(source, name), join(target, name));
    }
  } else if (info.isFile()) {
    await mkdir(resolve(target, '..'), { recursive: true });
    await copyFile(source, target);
  }
}

export async function createSharedHostingPackage(root, output, originValue) {
  const origin = productionOrigin(originValue), publicRoot = join(output, 'public_html'), backend = join(output, 'acm-backend');
  // Refuse to overwrite an old release or create a package outside release/.
  const outputRelative = relative(join(root, 'release'), resolve(output));
  if (!outputRelative || outputRelative === '..' || outputRelative.startsWith(`..${sep}`) || isAbsolute(outputRelative)) throw new Error('Release output must be inside the project release directory.');
  await mkdir(output, { recursive: false });
  for (const directory of ['app', 'config', 'resources', 'routes', 'lang', 'database/migrations']) {
    const source = join(root, 'backend', directory);
    if (await lstat(source).catch(() => null)) await copySource(source, join(backend, directory));
  }
  for (const file of ['artisan', 'composer.json', 'composer.lock', 'bootstrap/app.php', 'bootstrap/providers.php', 'public/index.php']) {
    await copySource(join(root, 'backend', file), join(backend, file));
  }
  for (const directory of ['bootstrap/cache', 'database/factories', 'database/seeders', 'storage/app/private', 'storage/app/public', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/logs']) {
    await mkdir(join(backend, directory), { recursive: true });
  }
  let environment = await readFile(join(root, 'deploy/.env.example'), 'utf8');
  environment = environment.replaceAll('https://example.com', origin).replace('SANCTUM_STATEFUL_DOMAINS=example.com', `SANCTUM_STATEFUL_DOMAINS=${new URL(origin).hostname}`);
  await writeFile(join(backend, '.env.example'), environment, { mode: 0o600 });
  await mkdir(publicRoot);
  for (const name of await readdir(join(root, 'dist'))) {
    if (['assets', 'brand', 'icons', 'index.html', 'manifest.webmanifest', 'sw.js'].includes(name) || /^workbox-[\w-]+\.js$/.test(name)) {
      await copySource(join(root, 'dist', name), join(publicRoot, name));
    }
  }
  for (const file of ['.htaccess', '.user.ini', 'backend.php']) {
    await copyFile(join(root, 'deploy/shared-hosting', file), join(publicRoot, file));
  }
  await copyFile(join(root, 'docs/DEPLOYMENT.md'), join(output, 'DEPLOYMENT.md'));
  const files = [];
  async function inventory(directory) {
    for (const name of (await readdir(directory)).sort()) {
      const path = join(directory, name), info = await lstat(path);
      if (info.isDirectory()) await inventory(path);
      else files.push({ path: relative(output, path).split(sep).join('/'), sha256: createHash('sha256').update(await readFile(path)).digest('hex'), bytes: info.size });
    }
  }
  await inventory(output);
  await writeFile(join(output, 'release-manifest.json'), `${JSON.stringify({ origin, createdAt: new Date().toISOString(), composerInstallRequired: true, files }, null, 2)}\n`);
  return { output, origin, files: files.length };
}
