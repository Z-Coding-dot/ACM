<?php

namespace App\Models;

class Customer extends TenantRecord
{
    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }
}
