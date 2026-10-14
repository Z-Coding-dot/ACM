<?php

namespace App\Http\Resources;

use App\Models\Business;
use App\Models\BusinessMembership;

class BusinessResource
{
    public static function data(Business $business, BusinessMembership $membership): array
    {
        $business->loadMissing(['settings', 'hours']);

        return [
            'id' => $business->id, 'name' => $business->name, 'industry' => $business->industry,
            'email' => $business->email, 'phone' => $business->phone, 'timeZone' => $business->time_zone,
            'currency' => $business->currency, 'locale' => $business->locale,
            'role' => $membership->role->value, 'permissions' => $membership->role->permissions(),
            'hours' => $business->hours->map(fn ($hour) => ['day' => $hour->day, 'open' => substr($hour->open_at, 0, 5), 'close' => substr($hour->close_at, 0, 5), 'closed' => $hour->closed, 'breaks' => $hour->breaks ?? []])->all(),
            'appointmentSettings' => ['slotMinutes' => $business->settings->slot_minutes, 'allowUnassigned' => $business->settings->allow_unassigned, 'requireConfirmation' => $business->settings->require_confirmation],
        ];
    }
}
