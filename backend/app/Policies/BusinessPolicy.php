<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function view(User $user, Business $business): bool
    {
        return $user->memberships()->where('business_id', $business->id)->exists();
    }

    public function update(User $user, Business $business): bool
    {
        $membership = $user->memberships()->where('business_id', $business->id)->first();

        return $membership && in_array('business.write', $membership->role->permissions(), true);
    }
}
