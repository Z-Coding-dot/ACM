<?php

namespace App\Services;

use App\Http\Resources\BusinessResource;
use App\Models\User;

class SessionProfile
{
    public function for(User $user): array
    {
        $memberships = $user->memberships()->with(['business.settings', 'business.hours'])->orderBy('id')->get();
        $businesses = $memberships->map(fn ($membership) => BusinessResource::data($membership->business, $membership))->all();
        $active = collect($businesses)->firstWhere('id', $user->active_business_id)['id'] ?? ($businesses[0]['id'] ?? null);

        return [
            'user' => ['id' => (string) $user->id, 'name' => $user->name, 'email' => $user->email, 'emailVerified' => $user->hasVerifiedEmail(), 'hasPassword' => filled($user->password), 'locale' => $user->locale, 'businessId' => $active, 'platformAdmin' => (bool) $user->is_platform_admin],
            'businesses' => $businesses,
            'activeBusinessId' => $active,
        ];
    }
}
