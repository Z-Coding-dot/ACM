<?php

namespace App\Enums;

enum BusinessRole: string
{
    case Owner = 'owner';
    case Administrator = 'administrator';
    case Receptionist = 'receptionist';
    case Staff = 'staff';

    public function permissions(): array
    {
        return match ($this) {
            self::Owner => ['workspace.read', 'business.write', 'memberships.write', 'customers.write', 'services.write', 'staff.write', 'appointments.write'],
            self::Administrator => ['workspace.read', 'business.write', 'customers.write', 'services.write', 'staff.write', 'appointments.write'],
            self::Receptionist => ['workspace.read', 'customers.write', 'appointments.write'],
            self::Staff => ['workspace.read'],
        };
    }
}
