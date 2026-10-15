<?php
namespace App\Policies;
class StaffMemberPolicy extends TenantPolicy { protected string $permission = 'staff.write'; }
