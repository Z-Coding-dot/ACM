# ACM Laravel backend

Laravel/Sanctum/Socialite with MySQL. The React frontend lives at the repository root. Use the [root README](../README.md) for full local installation and service startup.

From this backend directory after the root setup:

~~~sh
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
php artisan test --compact
php vendor/bin/pint --test
~~~

Tests require the dedicated MySQL acm_test database. Browser tests use acm_e2e_test and are launched from the root. Production starts without sample records; the default seeder is empty.

[API contract](../docs/API_INTEGRATION.md), [implementation/configuration](../docs/BACKEND_IMPLEMENTATION.md), [verification](../docs/VERIFICATION.md), [VPS deployment and backups](../docs/DEPLOYMENT.md).

Keep Google client secrets and other credentials in ignored environment configuration. Local callback: http://127.0.0.1:8000/auth/google/callback. Live Google sign-in requires external setup; automated provider tests use mocked responses.
