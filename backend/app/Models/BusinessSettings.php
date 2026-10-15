<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BusinessSettings extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'slot_minutes', 'allow_unassigned', 'require_confirmation'];
    protected function casts(): array { return ['slot_minutes' => 'integer', 'allow_unassigned' => 'boolean', 'require_confirmation' => 'boolean']; }
}
