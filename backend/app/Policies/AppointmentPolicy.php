<?php

namespace App\Policies;

class AppointmentPolicy extends TenantPolicy
{
    protected string $permission = 'appointments.write';
}
