<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAccountEnabled
{
    public function handle(Request $request, Closure $next)
    {
        abort_if($request->user()?->disabled_at, 403);

        return $next($request);
    }
}
