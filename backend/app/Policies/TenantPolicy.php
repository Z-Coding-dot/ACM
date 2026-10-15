<?php
namespace App\Policies;
use App\Models\Business;
use App\Models\TenantRecord;
use App\Models\User;
abstract class TenantPolicy {
    protected string $permission;
    public function view(User $user, TenantRecord $record): bool { return $user->memberships()->where('business_id',$record->business_id)->exists(); }
    public function create(User $user, Business $business): bool {
        $membership = $user->memberships()->where('business_id',$business->id)->first();
        return $user->hasVerifiedEmail() && $membership && in_array($this->permission,$membership->role->permissions(),true);
    }
    public function update(User $user, TenantRecord $record): bool { return $this->create($user,$record->business); }
    public function delete(User $user, TenantRecord $record): bool { return $this->update($user,$record); }
}
