<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Business;
use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PlatformTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_platform_admin' => true])->save();

        return $user;
    }

    public function test_platform_access_is_separate_from_business_ownership_and_cannot_be_registered(): void
    {
        $this->getJson('/api/v1/platform/overview')->assertUnauthorized();
        $owner = User::factory()->create();
        $business = Business::factory()->configured()->create();
        $business->memberships()->create(['user_id' => $owner->id, 'role' => 'owner']);
        $this->actingAs($owner)->getJson('/api/v1/platform/overview')->assertForbidden();
        $this->postJson('/api/v1/platform/users', ['is_platform_admin' => true])->assertForbidden();
        $this->patchJson('/api/v1/auth/account', ['name' => $owner->name, 'email' => $owner->email, 'is_platform_admin' => true])->assertOk();
        $this->assertFalse($owner->fresh()->is_platform_admin);
        $this->actingAs($this->admin())->getJson('/api/v1/platform/overview')->assertOk()->assertJsonPath('data.businesses', 1)->assertJsonPath('data.users', 2);
        $this->getJson('/api/v1/auth/session')->assertJsonPath('user.platformAdmin', true)->assertJsonCount(0, 'businesses');
    }

    public function test_platform_business_crud_requires_a_verified_owner_and_suspension_blocks_the_workspace(): void
    {
        $admin = $this->admin();
        $owner = User::factory()->create();
        $input = BusinessTest::input('Managed business') + ['ownerEmail' => $owner->email];
        $this->actingAs($admin)->postJson('/api/v1/platform/businesses', [...$input, 'ownerEmail' => 'unknown@example.test'])->assertUnprocessable();
        $id = $this->postJson('/api/v1/platform/businesses', $input)->assertCreated()->json('data.id');
        $this->getJson('/api/v1/platform/businesses?search=Managed')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.members', 1);
        $this->patchJson('/api/v1/platform/businesses/'.$id, ['name' => 'Renamed business', 'suspended' => true])->assertOk();
        $this->actingAs($owner)->withHeader('X-Business-ID', $id)->getJson('/api/v1/business')->assertForbidden();
        $this->actingAs($admin)->deleteJson('/api/v1/platform/businesses/'.$id, ['confirmation' => 'wrong'])->assertUnprocessable();
        $this->deleteJson('/api/v1/platform/businesses/'.$id, ['confirmation' => 'Renamed business'])->assertNoContent();
        $this->assertDatabaseMissing('businesses', ['id' => $id]);
        $this->assertDatabaseHas('activity_logs', ['actor_id' => $admin->id, 'method' => 'DELETE', 'resource' => 'api/v1/platform/businesses/{id}']);
    }

    public function test_platform_user_controls_block_disabled_users_and_protect_owners_and_admins(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $this->actingAs($admin);
        $id = $this->postJson('/api/v1/platform/users', ['name' => 'New user', 'email' => 'new@example.test', 'password' => 'SecurePassword123!', 'locale' => 'en', 'is_platform_admin' => true])->assertCreated()->assertJsonPath('data.platformAdmin', false)->assertJsonPath('data.emailVerified', false)->json('data.id');
        $this->patchJson('/api/v1/platform/users/'.$admin->id, ['name' => 'Owner', 'disabled' => true])->assertConflict();
        $this->deleteJson('/api/v1/platform/users/'.$admin->id, ['confirmation' => $admin->email])->assertConflict();
        $this->patchJson('/api/v1/platform/users/'.$id, ['name' => 'Disabled user', 'disabled' => true])->assertOk();
        $user = User::findOrFail($id);
        $this->actingAs($user)->getJson('/api/v1/auth/session')->assertForbidden();
        $this->actingAs($admin)->deleteJson('/api/v1/platform/users/'.$id, ['confirmation' => 'new@example.test'])->assertNoContent();
        $business = Business::factory()->configured()->create();
        $owner = User::factory()->create();
        $business->memberships()->create(['user_id' => $owner->id, 'role' => 'owner']);
        $this->deleteJson('/api/v1/platform/users/'.$owner->id, ['confirmation' => $owner->email])->assertConflict();
    }

    public function test_deleting_a_populated_business_removes_only_its_records_and_private_logo(): void
    {
        Storage::fake('local');
        $business = Business::factory()->configured()->create();
        $other = Business::factory()->configured()->create();
        $staff = StaffMember::factory()->create(['business_id' => $business->id]);
        $booking = Appointment::factory()->create(['business_id' => $business->id, 'staff_member_id' => $staff->id]);
        $staff->services()->attach($booking->service_id, ['business_id' => $business->id]);
        $retained = Appointment::factory()->create(['business_id' => $other->id]);
        $business->forceFill(['logo_path' => 'business-logos/test-logo.png'])->save();
        Storage::disk('local')->put($business->logo_path, 'test-image');
        $this->actingAs($this->admin())->deleteJson('/api/v1/platform/businesses/'.$business->id, ['confirmation' => $business->name])->assertNoContent();
        foreach (['businesses' => 'id', 'appointments' => 'business_id', 'customers' => 'business_id', 'services' => 'business_id', 'staff_members' => 'business_id', 'staff_services' => 'business_id', 'business_hours' => 'business_id', 'business_settings' => 'business_id'] as $table => $column) {
            $this->assertDatabaseMissing($table, [$column => $business->id]);
        }
        $this->assertDatabaseHas('appointments', ['id' => $retained->id]);
        $this->assertDatabaseHas('customers', ['id' => $retained->customer_id]);
        $this->assertDatabaseHas('businesses', ['id' => $other->id]);
        Storage::disk('local')->assertMissing('business-logos/test-logo.png');
    }

    public function test_cms_drafts_are_private_and_publish_reset_and_locale_are_isolated(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->putJson('/api/v1/platform/content/landing.heroTitle', ['locale' => 'en', 'value' => 'Draft heading', 'publish' => false])->assertNoContent();
        $this->getJson('/api/v1/public/content?locale=en')->assertOk()->assertJsonMissing(['landing.heroTitle' => 'Draft heading']);
        $this->putJson('/api/v1/platform/content/auth.login', ['locale' => 'en', 'value' => 'Hijacked', 'publish' => true])->assertNotFound();
        $this->putJson('/api/v1/platform/content/landing.userDashboard', ['locale' => 'en', 'value' => 'Missing placeholder', 'publish' => true])->assertUnprocessable();
        $this->putJson('/api/v1/platform/content/landing.heroTitle', ['locale' => 'en', 'value' => 'Published heading', 'publish' => true])->assertNoContent();
        $this->putJson('/api/v1/platform/content/landing.heroTitle', ['locale' => 'en', 'value' => 'Next draft', 'publish' => false])->assertNoContent();
        $published = $this->getJson('/api/v1/public/content?locale=en')->assertOk()->json('data');
        $this->assertSame('Published heading', $published['landing.heroTitle']);
        $this->getJson('/api/v1/public/content?locale=fa-AF')->assertJsonMissing(['landing.heroTitle' => 'Published heading']);
        $this->deleteJson('/api/v1/platform/content/landing.heroTitle', ['locale' => 'en'])->assertNoContent();
        $this->assertDatabaseCount('public_content', 0);
    }

    public function test_analytics_store_only_valid_page_aggregates_and_audit_logs_exclude_request_bodies(): void
    {
        $this->postJson('/api/v1/public/page-views', ['path' => '/', 'locale' => 'en', 'email' => 'private@example.test'])->assertNoContent();
        $this->postJson('/api/v1/public/page-views', ['path' => '/', 'locale' => 'en'])->assertNoContent();
        $this->postJson('/api/v1/public/page-views', ['path' => '/app/customers?private=value', 'locale' => 'en'])->assertUnprocessable();
        $this->assertDatabaseHas('page_views', ['path' => '/', 'views' => 2]);
        $admin = $this->admin();
        $this->actingAs($admin)->getJson('/api/v1/platform/overview')->assertJsonPath('data.pageViews', 2);
        $this->patchJson('/api/v1/platform/users/'.$admin->id, ['name' => 'Owner', 'disabled' => false, 'password' => 'private-password'])->assertOk();
        $log = json_encode(DB::table('activity_logs')->get());
        $this->assertStringNotContainsString('private-password', $log);
        $this->assertStringNotContainsString('private@example.test', $log);
    }

    public function test_platform_access_command_protects_the_last_admin_and_rejects_unverified_accounts(): void
    {
        $admin = $this->admin();
        $this->artisan('acm:platform-admin', ['email' => $admin->email, '--revoke' => true])->assertFailed();
        $unverified = User::factory()->unverified()->create();
        $this->artisan('acm:platform-admin', ['email' => $unverified->email])->assertFailed();
        $other = User::factory()->create();
        $this->artisan('acm:platform-admin', ['email' => $other->email])->assertSuccessful();
        $this->artisan('acm:platform-admin', ['email' => $admin->email, '--revoke' => true])->assertSuccessful();
        $this->assertFalse($admin->fresh()->is_platform_admin);
        $this->assertTrue($other->fresh()->is_platform_admin);
    }
}
