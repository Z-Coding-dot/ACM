<?php

namespace App\Http\Controllers;

use App\Http\Requests\MembershipAccountRequest;
use App\Http\Requests\MembershipRequest;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MembershipController extends Controller
{
    private function authorizeOwner(Request $r): void
    {
        abort_unless(in_array('memberships.write', $r->attributes->get('membership')->role->permissions(), true), 403);
    }

    private function data(BusinessMembership $m): array
    {
        return ['id' => (string) $m->id, 'userId' => (string) $m->user_id, 'name' => $m->user->name, 'email' => $m->user->email, 'role' => $m->role->value, 'emailVerified' => $m->user->hasVerifiedEmail()];
    }

    public function index(Request $r)
    {
        $this->authorizeOwner($r);

        return response()->json(['data' => $r->attributes->get('business')->memberships()->with('user')->orderBy('id')->get()->map(fn ($m) => $this->data($m))->all()]);
    }

    public function store(MembershipRequest $r)
    {
        $this->authorizeOwner($r);
        $v = $r->validated();
        $m = DB::transaction(function () use ($r, $v) {
            $business = Business::whereKey($r->attributes->get('business')->id)->lockForUpdate()->firstOrFail();
            $user = User::where('email', $v['email'])->whereNotNull('email_verified_at')->whereNull('disabled_at')->first();
            if (! $user) {
                throw ValidationException::withMessages(['email' => ['memberships.verifiedAccount']]);
            }
            if ($business->memberships()->where('user_id', $user->id)->exists()) {
                throw ValidationException::withMessages(['email' => ['error.duplicate']]);
            }

            return $business->memberships()->create(['user_id' => $user->id, 'role' => $v['role']])->load('user');
        }, 3);

        return response()->json(['data' => $this->data($m)], 201);
    }

    public function createAccount(MembershipAccountRequest $request)
    {
        $this->authorizeOwner($request);
        $input = $request->validated();
        try {
            $membership = DB::transaction(function () use ($request, $input) {
                $business = Business::whereKey($request->attributes->get('business')->id)->lockForUpdate()->firstOrFail();
                abort_if($business->suspended_at, 403);
                $user = User::create(['name' => $input['name'], 'email' => $input['email'], 'password' => $input['password'], 'locale' => $business->locale]);
                $user->forceFill(['active_business_id' => $business->id])->save();

                return $business->memberships()->create(['user_id' => $user->id, 'role' => $input['role']])->load('user');
            }, 3);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['email' => ['memberships.accountExists']]);
        }
        try {
            $membership->user->sendEmailVerificationNotification();
            $sent = true;
        } catch (\Throwable $error) {
            $sent = false;
            Log::warning('Workspace account verification delivery failed.', ['exception' => $error::class]);
        }

        return response()->json(['data' => $this->data($membership), 'verificationEmailSent' => $sent], 201);
    }

    public function update(MembershipRequest $r, string $id)
    {
        $this->authorizeOwner($r);
        $m = DB::transaction(function () use ($r, $id) {
            Business::whereKey($r->attributes->get('business')->id)->lockForUpdate()->firstOrFail();
            $m = BusinessMembership::where('business_id', $r->attributes->get('business')->id)->findOrFail($id);
            abort_if($m->role->value === 'owner', 409);
            $m->update(['role' => $r->validated('role')]);

            return $m->load('user');
        }, 3);

        return response()->json(['data' => $this->data($m)]);
    }

    public function destroy(Request $r, string $id)
    {
        $this->authorizeOwner($r);
        DB::transaction(function () use ($r, $id) {
            $business = Business::whereKey($r->attributes->get('business')->id)->lockForUpdate()->firstOrFail();
            $m = BusinessMembership::where('business_id', $business->id)->findOrFail($id);
            abort_if($m->role->value === 'owner', 409);
            StaffMember::where('business_id', $business->id)->where('user_id', $m->user_id)->update(['user_id' => null]);
            User::whereKey($m->user_id)->where('active_business_id', $business->id)->update(['active_business_id' => null]);
            $m->delete();
        }, 3);

        return response()->noContent();
    }
}
