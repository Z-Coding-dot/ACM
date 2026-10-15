<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->trustProxies(at: ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
        $middleware->trustHosts(at: fn () => ['^'.preg_quote((string) parse_url(config('app.url'), PHP_URL_HOST)).'$'], subdomains: false);
        $middleware->alias(['business' => \App\Http\Middleware\ResolveBusiness::class]);
        $middleware->redirectGuestsTo(fn () => config('acm.frontend_url').'/login');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontFlash(['password', 'password_confirmation', 'currentPassword', 'token', 'code', 'state']);
        $exceptions->shouldRenderJsonWhen(fn (\Illuminate\Http\Request $request) => $request->is('api/*') || $request->expectsJson());
        $exceptions->report(function (\Illuminate\Database\QueryException $error) {
            \Illuminate\Support\Facades\Log::error('Database request failed.', ['exception' => $error::class, 'sqlState' => $error->errorInfo[0] ?? null]);
            return false;
        });
    })->create();
