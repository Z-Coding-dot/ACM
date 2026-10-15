#!/bin/sh
set -eu
# Restrict runtime credentials to data operations. The separate migration account
# can change this one schema, but cannot administer other databases.
for value in "$MYSQL_PASSWORD" "$MIGRATION_DB_PASSWORD"; do
  case "$value" in ''|*[!a-fA-F0-9]*) echo "Generate database passwords as hexadecimal values." >&2; exit 1;; esac
  [ "${#value}" -ge 32 ] || { echo "Database passwords must contain at least 32 hexadecimal characters." >&2; exit 1; }
done
MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --user=root <<SQL
REVOKE ALL PRIVILEGES ON acm.* FROM 'acm'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON acm.* TO 'acm'@'%';
CREATE USER 'acm_migrate'@'%' IDENTIFIED BY '$MIGRATION_DB_PASSWORD';
GRANT ALL PRIVILEGES ON acm.* TO 'acm_migrate'@'%';
SQL
