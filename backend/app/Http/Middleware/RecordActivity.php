<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecordActivity
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        if ($request->user() && in_array($request->method(), ['POST', 'PATCH', 'PUT', 'DELETE'], true) && $response->isSuccessful()) {
            $businessId = $request->attributes->get('business')?->id;
            $id = $request->route('id') ?? $request->route('key');
            DB::table('activity_logs')->insert([
                'actor_id' => $request->user()->id,
                'business_id' => $businessId,
                'method' => $request->method(),
                'resource' => $request->route()->uri(),
                'record_id' => is_string($id) ? substr($id, 0, 120) : null,
                'created_at' => now(),
            ]);
        }

        return $response;
    }
}
