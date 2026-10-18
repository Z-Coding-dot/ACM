<?php

namespace App\Http\Controllers;

use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class BusinessLogoController extends Controller
{
    public function show(Request $request, string $id)
    {
        $business = Business::findOrFail($id);
        abort_unless($request->user()->is_platform_admin || $request->user()->memberships()->where('business_id', $id)->exists(), 404);
        abort_unless($business->logo_path && Storage::disk('local')->exists($business->logo_path), 404);

        return response()->file(Storage::disk('local')->path($business->logo_path), [
            'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function store(Request $request)
    {
        $business = $request->attributes->get('business');
        Gate::authorize('update', $business);
        $request->validate(['logo' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:2048', 'dimensions:max_width=4096,max_height=4096']]);
        $path = $request->file('logo')->store('business-logos', 'local');
        abort_unless($path, 503);
        try {
            $old = DB::transaction(function () use ($business, $path) {
                $record = Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
                Gate::authorize('update', $record);
                $old = $record->logo_path;
                $record->forceFill(['logo_path' => $path])->save();

                return $old;
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($path);
            throw $error;
        }
        if ($old) {
            Storage::disk('local')->delete($old);
        }

        return $this->profile($request, $business);
    }

    public function destroy(Request $request)
    {
        $business = $request->attributes->get('business');
        Gate::authorize('update', $business);
        $old = DB::transaction(function () use ($business) {
            $record = Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
            Gate::authorize('update', $record);
            $old = $record->logo_path;
            $record->forceFill(['logo_path' => null])->save();

            return $old;
        });
        if ($old) {
            Storage::disk('local')->delete($old);
        }

        return $this->profile($request, $business);
    }

    private function profile(Request $request, Business $business)
    {
        return response()->json(['data' => BusinessResource::data($business->fresh(), $request->attributes->get('membership'))]);
    }
}
