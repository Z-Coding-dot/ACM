<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless($request->user()?->is_platform_admin && ! $request->user()->disabled_at, 403);

        return $next($request);
    }
}
