<?php

namespace Tests\Feature;

use App\Enums\BusinessRole;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessTest extends TestCase
{
    use RefreshDatabase;

    public static function input(string $name = 'Test business'): array
    {
        return ['name' => $name, 'industry' => 'other', 'email' => 'business@example.test', 'phone' => '', 'timeZone' => 'UTC', 'currency' => 'USD', 'locale' => 'en',
            'hours' => array_map(fn ($day) => ['day' => $day, 'open' => '09:00', 'close' => '17:00', 'closed' => false], range(0, 6)),
            'appointmentSettings' => ['slotMinutes' => 30, 'allowUnassigned' => true, 'requireConfirmation' => false]];
    }

    private function create(User $user, string $name = 'Test business'): string
    {
        $id = $this->actingAs($user, 'web')->postJson('/api/v1/businesses', self::input($name))->assertCreated()->json('activeBusinessId');
        $this->assertDatabaseHas('business_memberships', ['business_id' => $id, 'user_id' => $user->id, 'role' => 'owner']);

        return $id;
    }

    public function test_verified_onboarding_creates_business_membership_hours_and_settings_atomically(): void
    {
        $user = User::factory()->create();
        $id = $this->create($user);
        $this->assertDatabaseHas('business_memberships', ['business_id' => $id, 'user_id' => $user->id, 'role' => 'owner']);
        $this->assertDatabaseHas('business_settings', ['business_id' => $id, 'slot_minutes' => 30]);
        $this->assertDatabaseCount('business_hours', 7);
        $this->assertSame($id, $user->fresh()->active_business_id);
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('businesses.0.id', $id)->assertJsonPath('businesses.0.role', 'owner');
    }

    public function test_unverified_and_guest_accounts_cannot_create_workspaces(): void
    {
        $this->postJson('/api/v1/businesses', self::input())->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create())->postJson('/api/v1/businesses', self::input())->assertForbidden();
        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_active_workspace_selection_is_checked_and_persisted(): void
    {
        $user = User::factory()->create();
        $first = $this->create($user, 'First');
        $second = $this->create($user, 'Second');
        $this->postJson('/api/v1/auth/workspace', ['businessId' => $first])->assertOk()->assertJsonPath('activeBusinessId', $first);
        $this->assertSame($first, $user->fresh()->active_business_id);
        $this->getJson('/api/v1/me')->assertJsonCount(2, 'businesses');
        $other = User::factory()->create();
        $foreign = $this->create($other, 'Foreign');
        $this->actingAs($user)->postJson('/api/v1/auth/workspace', ['businessId' => $foreign])->assertNotFound();
        $this->assertNotSame($foreign, $user->fresh()->active_business_id);
        $this->assertNotSame($first, $second);
    }

    public function test_tenant_headers_cannot_read_or_update_another_business(): void
    {
        $owner = User::factory()->create();
        $id = $this->create($owner);
        $attacker = User::factory()->create();
        $this->actingAs($attacker)->withHeader('X-Business-ID', $id)->getJson('/api/v1/business')->assertNotFound();
        $this->patchJson('/api/v1/business', self::input('Hijacked'))->assertNotFound();
        $this->assertSame('Test business', Business::findOrFail($id)->name);
    }

    public function test_staff_members_can_read_but_cannot_modify_business_settings(): void
    {
        $owner = User::factory()->create();
        $id = $this->create($owner);
        $staff = User::factory()->create();
        Business::findOrFail($id)->memberships()->create(['user_id' => $staff->id, 'role' => BusinessRole::Staff]);
        $this->actingAs($staff)->withHeader('X-Business-ID', $id)->getJson('/api/v1/business')->assertOk()->assertJsonPath('data.permissions', ['workspace.read']);
        $this->patchJson('/api/v1/business', self::input('Unauthorized'))->assertForbidden();
    }

    public function test_settings_hours_and_breaks_are_persisted_without_client_privilege_assignment(): void
    {
        $owner = User::factory()->create();
        $id = $this->create($owner);
        $input = self::input('Updated');
        $input['currency'] = 'JPY';
        $input['locale'] = 'fa-AF';
        $input['hours'][1]['breaks'] = [['open' => '12:00', 'close' => '13:00']];
        $input['role'] = 'staff';
        $this->withHeader('X-Business-ID', $id)->patchJson('/api/v1/business', $input)->assertOk()->assertJsonPath('data.currency', 'JPY')->assertJsonPath('data.hours.1.breaks.0.open', '12:00')->assertJsonPath('data.role', 'owner');
        $this->assertDatabaseHas('businesses', ['id' => $id, 'name' => 'Updated', 'locale' => 'fa-AF']);
    }

    public function test_invalid_hours_timezones_and_malformed_types_are_rejected_without_writes(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (['duplicate', 'overnight', 'timezone', 'array-day', 'array-time', 'overlapping-breaks', 'array-industry'] as $case) {
            $input = self::input();
            match ($case) {
                'duplicate' => $input['hours'][1]['day'] = 0,
                'overnight' => $input['hours'][0]['close'] = '08:00',
                'timezone' => $input['timeZone'] = 'Invalid/Zone',
                'array-day' => $input['hours'][0]['day'] = [],
                'array-time' => $input['hours'][0]['open'] = [],
                'array-industry' => $input['industry'] = ['other'],
                default => $input['hours'][0]['breaks'] = [['open' => '12:00', 'close' => '14:00'], ['open' => '13:00', 'close' => '15:00']],
            };
            $this->postJson('/api/v1/businesses', $input)->assertUnprocessable();
        }
        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('business_memberships', 0);
    }
}
