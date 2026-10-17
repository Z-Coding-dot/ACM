<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
