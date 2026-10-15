<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        RateLimiter::for('login', fn (Request $request) => [Limit::perMinute(30)->by($request->ip()), Limit::perMinute(5)->by(hash('sha256', Str::lower(is_string($request->input('email')) ? $request->input('email') : '').'|'.$request->ip()))]);
        RateLimiter::for('registration', fn (Request $request) => Limit::perHour(20)->by($request->ip()));
        RateLimiter::for('passwords', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        ResetPassword::createUrlUsing(fn ($user, string $token) => config('acm.frontend_url').'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->email]));
    }
}
