<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

abstract class TenantRecord extends Model
{
    use HasFactory, HasUlids;

    protected $guarded = ['id', 'business_id'];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
