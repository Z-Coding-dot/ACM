<?php
namespace App\Models;
class Service extends TenantRecord {
    protected function casts(): array { return ['active' => 'boolean', 'duration_minutes' => 'integer', 'price_minor' => 'integer']; }
}
