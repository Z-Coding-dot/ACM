import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createSharedHostingPackage, productionOrigin } from './lib/shared-hosting-package.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--origin') {
  console.error('Usage: npm run deploy:prepare -- --origin https://your-domain.com');
  process.exit(1);
}
try {
  const origin = productionOrigin(args[1]);
  const environment = { ...process.env, VITE_API_BASE_URL: '/api/v1', VITE_GOOGLE_AUTH_URL: `${origin}/auth/google/redirect` };
  for (const [script, parameters] of [['typescript/bin/tsc', ['-b']], ['vite/bin/vite.js', ['build']]]) {
    const result = spawnSync(process.execPath, [join(root, 'node_modules', script), ...parameters], { cwd: root, env: environment, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error('Production frontend build failed. No release was prepared.');
  }
  const releases = join(root, 'release'); await mkdir(releases, { recursive: true });
  const output = join(releases, `namecheap-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`);
  const result = await createSharedHostingPackage(root, output, origin);
  console.log(`Prepared ${result.files} files in ${result.output}`);
  console.log('Upload acm-backend outside the web root and public_html contents into the domain document root.');
  console.log('Composer production installation and private production .env configuration are required on the server.');
  console.log('Read DEPLOYMENT.md in the release. This command does not upload or deploy anything.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Release preparation failed.');
  process.exitCode = 1;
}
