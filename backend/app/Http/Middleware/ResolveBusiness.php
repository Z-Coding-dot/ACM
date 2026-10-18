<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ResolveBusiness
{
    public function handle(Request $request, Closure $next)
    {
        $id = $request->header('X-Business-ID') ?: $request->user()->active_business_id;
        abort_unless(is_string($id) && strlen($id) === 26, 404);
        $membership = $request->user()->memberships()->with('business')->where('business_id', $id)->first();
        abort_unless($membership, 404);
        abort_if($membership->business->suspended_at, 403);
        $request->attributes->set('business', $membership->business);
        $request->attributes->set('membership', $membership);

        return $next($request);
    }
}
