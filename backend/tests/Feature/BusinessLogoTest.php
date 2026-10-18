<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessLogoTest extends TestCase
{
    use RefreshDatabase;

    private function image(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('logo.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
    }

    public function test_owner_upload_replacement_private_access_and_removal(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $business = Business::factory()->configured()->create();
        $business->memberships()->create(['user_id' => $owner->id, 'role' => 'owner']);
        $this->actingAs($owner)->withHeader('X-Business-ID', $business->id)->post('/api/v1/business/logo', ['logo' => $this->image()], ['Accept' => 'application/json'])->assertOk();
        $first = $business->fresh()->logo_path;
        Storage::disk('local')->assertExists($first);
        $this->get('/api/v1/businesses/'.$business->id.'/logo')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->post('/api/v1/business/logo', ['logo' => $this->image()], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('local')->assertMissing($first);
        $second = $business->fresh()->logo_path;
        $this->actingAs(User::factory()->create())->getJson('/api/v1/businesses/'.$business->id.'/logo')->assertNotFound();
        $this->post('/api/v1/business/logo', ['logo' => $this->image()], ['Accept' => 'application/json'])->assertNotFound();
        $this->actingAs($owner)->deleteJson('/api/v1/business/logo')->assertOk()->assertJsonPath('data.logoUrl', null);
        Storage::disk('local')->assertMissing($second);
    }

    public function test_staff_cannot_change_branding_and_executable_or_oversized_uploads_are_rejected(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $business = Business::factory()->configured()->create();
        $business->memberships()->create(['user_id' => $owner->id, 'role' => 'owner']);
        $business->memberships()->create(['user_id' => $staff->id, 'role' => 'staff']);
        $this->actingAs($staff)->withHeader('X-Business-ID', $business->id)->post('/api/v1/business/logo', ['logo' => $this->image()], ['Accept' => 'application/json'])->assertForbidden();
        $this->actingAs($owner)->post('/api/v1/business/logo', ['logo' => UploadedFile::fake()->createWithContent('fake.png', '<?php echo "unsafe";')], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->post('/api/v1/business/logo', ['logo' => UploadedFile::fake()->create('huge.png', 2049, 'image/png')], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertNull($business->fresh()->logo_path);
    }
}
