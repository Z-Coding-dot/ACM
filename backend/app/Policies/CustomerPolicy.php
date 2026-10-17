<?php

namespace App\Policies;

class CustomerPolicy extends TenantPolicy
{
    protected string $permission = 'customers.write';
}
