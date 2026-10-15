#!/bin/sh
set -eu
cd /var/www/acm
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
php artisan acm:production-check
php artisan config:cache
php artisan route:cache
php artisan view:cache
exec "$@"
