import { spawnSync } from 'node:child_process';
const sql = "CREATE DATABASE IF NOT EXISTS acm_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS acm_e2e_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON acm_test.* TO 'acm'@'%'; GRANT ALL PRIVILEGES ON acm_e2e_test.* TO 'acm'@'%';";
const result = spawnSync('docker', ['compose', '--env-file', 'backend/.env', '-f', 'compose.dev.yaml', '-p', 'acm-dev', 'exec', '-T', 'mysql', 'sh', '-c', 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --user=root'], { input: sql, encoding: 'utf8' });
if (result.error || result.status !== 0) { console.error('Could not prepare the local test schemas. Start the acm-dev MySQL container first.'); process.exit(1); }
const migrated = spawnSync('php', ['artisan', 'migrate', '--env=browser', '--force'], { cwd: 'backend', stdio: 'inherit' });
process.exitCode = migrated.status ?? 1;
