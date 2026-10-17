<?php

namespace App\Http\Resources;

use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\TenantRecord;

class DirectoryResource
{
    public static function data(TenantRecord $record): array
    {
        $data = ['id' => $record->id, 'businessId' => $record->business_id, 'name' => $record->name, 'active' => $record->active];

        return match (true) {
            $record instanceof Customer => [...$data, 'email' => $record->email, 'phone' => $record->phone, 'notes' => $record->notes ?? '', 'createdAt' => $record->created_at->toISOString()],
            $record instanceof Service => [...$data, 'description' => $record->description ?? '', 'durationMinutes' => $record->duration_minutes, 'priceMinor' => $record->price_minor, 'currency' => $record->currency],
            $record instanceof StaffMember => [...$data, 'email' => $record->email, 'phone' => $record->phone, 'serviceIds' => $record->services->pluck('id')->all(), 'hours' => $record->hours, 'userId' => $record->user_id ? (string) $record->user_id : null],
        };
    }
}
