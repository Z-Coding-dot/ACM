<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PlatformAdmin extends Command
{
    protected $signature = 'acm:platform-admin {email} {--revoke} {--create-local : Create a temporary verified account in the local environment}';

    protected $description = 'Grant or revoke platform access for a verified account; never available through public registration';

    public function handle(): int
    {
        $email = mb_strtolower(trim($this->argument('email')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Supply a valid account email.');

            return self::FAILURE;
        }
        $user = User::where('email', $email)->first();
        if (! $user && $this->option('create-local')) {
            if (! app()->environment('local') || $this->option('revoke') || ! str_ends_with($email, '.test')) {
                $this->error('Temporary accounts require APP_ENV=local and an email ending in .test.');

                return self::FAILURE;
            }
            $password = Str::password(24);
            $user = User::create(['name' => 'Platform owner', 'email' => $email, 'password' => $password, 'locale' => 'en']);
            $user->forceFill(['email_verified_at' => now()])->save();
            $path = 'platform-owner-credentials.txt';
            Storage::disk('local')->put($path, "Email: {$email}\nPassword: {$password}\nLogin: ".config('acm.frontend_url')."/login\nDashboard: ".config('acm.frontend_url')."/platform\n");
            @chmod(Storage::disk('local')->path($path), 0600);
            $this->info('Temporary credentials saved privately to '.Storage::disk('local')->path($path));
        }
        if (! $user || ! $user->hasVerifiedEmail() || $user->disabled_at) {
            $this->error('An existing, verified and enabled account is required.');

            return self::FAILURE;
        }
        $changed = DB::transaction(function () use ($user) {
            $admins = User::where('is_platform_admin', true)->orderBy('id')->lockForUpdate()->get();
            if ($this->option('revoke') && $user->is_platform_admin && $admins->count() <= 1) {
                return false;
            }
            $user->forceFill(['is_platform_admin' => ! $this->option('revoke')])->save();
            DB::table('activity_logs')->insert(['actor_id' => $user->id, 'method' => 'CLI', 'resource' => $this->option('revoke') ? 'platform-access/revoke' : 'platform-access/grant', 'record_id' => (string) $user->id, 'created_at' => now()]);

            return true;
        });
        if (! $changed) {
            $this->error('The last platform administrator cannot be revoked.');

            return self::FAILURE;
        }
        $this->info('Platform access '.($this->option('revoke') ? 'revoked.' : 'granted.'));

        return self::SUCCESS;
    }
}
