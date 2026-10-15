<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BusinessHour extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $fillable = ['business_id', 'day', 'open_at', 'close_at', 'closed', 'breaks'];
    protected function casts(): array { return ['day' => 'integer', 'closed' => 'boolean', 'breaks' => 'array']; }
}
