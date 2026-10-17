<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class StaffMember extends TenantRecord
{
    protected function casts(): array
    {
        return ['active' => 'boolean', 'hours' => 'array'];
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'staff_services')->withPivot('business_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
