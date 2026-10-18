<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class MembershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_change_and_revoke_existing_verified_accounts_without_losing_ownership(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $business = $this->actingAs($owner)->postJson('/api/v1/businesses', BusinessTest::input())->json('activeBusinessId');
        $this->withHeader('X-Business-ID', $business);
        $id = $this->postJson('/api/v1/memberships', ['email' => $member->email, 'role' => 'staff'])->assertCreated()->json('data.id');
        $this->postJson('/api/v1/memberships', ['email' => $member->email, 'role' => 'staff'])->assertUnprocessable();
        $this->patchJson('/api/v1/memberships/'.$id, ['role' => 'receptionist'])->assertOk()->assertJsonPath('data.role', 'receptionist');
        $this->actingAs($member)->getJson('/api/v1/business')->assertOk()->assertJsonPath('data.role', 'receptionist');
        $this->postJson('/api/v1/memberships', ['email' => $owner->email, 'role' => 'administrator'])->assertForbidden();
        $this->getJson('/api/v1/memberships')->assertForbidden();
        $this->actingAs($owner)->deleteJson('/api/v1/memberships/'.$id)->assertNoContent();
        $this->actingAs($member)->getJson('/api/v1/business')->assertNotFound();
        $ownerId = Business::findOrFail($business)->memberships()->where('user_id', $owner->id)->value('id');
        $this->actingAs($owner)->deleteJson('/api/v1/memberships/'.$ownerId)->assertConflict();
        $this->patchJson('/api/v1/memberships/'.$ownerId, ['role' => 'staff'])->assertConflict();
    }

    public function test_unknown_unverified_accounts_owner_assignment_and_foreign_memberships_are_rejected(): void
    {
        $owner = User::factory()->create();
        $unverified = User::factory()->unverified()->create();
        $business = $this->actingAs($owner)->postJson('/api/v1/businesses', BusinessTest::input())->json('activeBusinessId');
        $this->withHeader('X-Business-ID', $business);
        foreach (['unknown@example.test', $unverified->email] as $email) {
            $this->postJson('/api/v1/memberships', ['email' => $email, 'role' => 'staff'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/memberships', ['email' => $owner->email, 'role' => 'owner'])->assertUnprocessable();
        $other = User::factory()->create();
        $foreign = $this->actingAs($other)->postJson('/api/v1/businesses', BusinessTest::input('Other'))->json('activeBusinessId');
        $id = Business::findOrFail($foreign)->memberships()->value('id');
        $this->actingAs($owner)->patchJson('/api/v1/memberships/'.$id, ['role' => 'staff'])->assertNotFound();
        $this->deleteJson('/api/v1/memberships/'.$id)->assertNotFound();
    }

    public function test_owner_can_create_a_login_and_the_member_can_verify_and_access_only_the_assigned_workspace(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $business = $this->actingAs($owner)->postJson('/api/v1/businesses', BusinessTest::input())->json('activeBusinessId');
        $this->withHeader('X-Business-ID', $business);
        $response = $this->postJson('/api/v1/memberships/accounts', ['name' => 'New receptionist', 'email' => ' New.Person@Example.test ', 'password' => 'InitialPassword123!', 'role' => 'receptionist', 'is_platform_admin' => true, 'email_verified_at' => now()->toISOString()]);
        $response->assertCreated()->assertJsonPath('data.role', 'receptionist')->assertJsonPath('data.emailVerified', false)->assertJsonPath('verificationEmailSent', true)->assertJsonMissingPath('data.password');
        $this->assertAuthenticatedAs($owner);
        $member = User::where('email', 'new.person@example.test')->firstOrFail();
        $this->assertTrue(Hash::check('InitialPassword123!', $member->password));
        $this->assertFalse($member->is_platform_admin);
        $this->assertFalse($member->hasVerifiedEmail());
        $this->assertSame($business, $member->active_business_id);
        Notification::assertSentTo($member, VerifyEmail::class);
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'InitialPassword123!'])->assertOk()->assertJsonPath('user.emailVerified', false);
        $this->getJson('/api/v1/business')->assertForbidden();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), ['id' => $member->id, 'hash' => sha1($member->email)]);
        $this->get($url)->assertRedirect('http://127.0.0.1:5173/app/overview');
        $this->getJson('/api/v1/business')->assertOk()->assertJsonPath('data.role', 'receptionist');
        $foreign = Business::factory()->configured()->create();
        $this->withHeader('X-Business-ID', $foreign->id)->getJson('/api/v1/business')->assertNotFound();
    }

    public function test_creating_workspace_accounts_never_resets_existing_users_or_grants_owner_access(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $existing = User::factory()->create();
        $originalPassword = $existing->password;
        $business = $this->actingAs($owner)->postJson('/api/v1/businesses', BusinessTest::input())->json('activeBusinessId');
        $this->withHeader('X-Business-ID', $business);
        $input = ['name' => 'Staff login', 'email' => 'new-staff@example.test', 'password' => 'InitialPassword123!', 'role' => 'staff'];
        $this->postJson('/api/v1/memberships/accounts', [...$input, 'email' => $existing->email])->assertUnprocessable()->assertJsonPath('errors.email.0', 'memberships.accountExists');
        $this->assertSame($originalPassword, $existing->fresh()->password);
        $this->postJson('/api/v1/memberships/accounts', [...$input, 'password' => 'short'])->assertUnprocessable();
        $this->postJson('/api/v1/memberships/accounts', [...$input, 'role' => 'owner'])->assertUnprocessable();
        $this->assertDatabaseMissing('users', ['email' => 'new-staff@example.test']);
        $businessModel = Business::findOrFail($business);
        foreach (['administrator', 'receptionist', 'staff'] as $role) {
            $member = User::factory()->create();
            $businessModel->memberships()->create(['user_id' => $member->id, 'role' => $role]);
            $this->actingAs($member)->postJson('/api/v1/memberships/accounts', $input)->assertForbidden();
        }
        $this->assertDatabaseMissing('users', ['email' => 'new-staff@example.test']);
        Notification::assertNothingSent();
    }
}
