<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessHour extends Model
{
    public $timestamps = false;
    protected $fillable = ['business_id', 'day', 'open_at', 'close_at', 'closed', 'breaks'];
    protected function casts(): array { return ['day' => 'integer', 'closed' => 'boolean', 'breaks' => 'array']; }
}
