<?php
namespace App\Policies;
class ServicePolicy extends TenantPolicy { protected string $permission = 'services.write'; }
