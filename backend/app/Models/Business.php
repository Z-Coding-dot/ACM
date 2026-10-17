<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Business extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['name', 'industry', 'email', 'phone', 'time_zone', 'currency', 'locale'];

    public function memberships(): HasMany
    {
        return $this->hasMany(BusinessMembership::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(BusinessSettings::class);
    }

    public function hours(): HasMany
    {
        return $this->hasMany(BusinessHour::class)->orderBy('day');
    }
}
