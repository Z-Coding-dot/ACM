<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_and_platform_admins_can_change_their_own_password_and_log_in_again(): void
    {
        foreach ([false, true] as $admin) {
            $user = User::factory()->create(['password' => 'OriginalPassword123!']);
            $user->forceFill(['is_platform_admin' => $admin])->save();
            $this->actingAs($user)->putJson('/api/v1/auth/password', ['currentPassword' => 'wrong', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])
                ->assertUnprocessable()->assertJsonValidationErrors('currentPassword');
            $this->assertTrue(Hash::check('OriginalPassword123!', $user->fresh()->password));
            $this->putJson('/api/v1/auth/password', ['currentPassword' => 'OriginalPassword123!', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!', 'is_platform_admin' => ! $admin])
                ->assertOk()->assertJsonPath('user.hasPassword', true)->assertJsonPath('user.platformAdmin', $admin)->assertJsonMissingPath('user.password');
            $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
            $this->assertAuthenticatedAs($user);
            $this->postJson('/api/v1/auth/logout')->assertNoContent();
            $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'OriginalPassword123!'])->assertUnauthorized();
            $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'NewPassword123!'])->assertOk();
        }
    }

    public function test_passwords_require_confirmation_and_obey_the_bcrypt_byte_limit(): void
    {
        $user = User::factory()->create(['password' => 'OriginalPassword123!']);
        foreach (['short', str_repeat('a', 73), str_repeat('م', 37)] as $password) {
            $this->actingAs($user)->putJson('/api/v1/auth/password', ['currentPassword' => 'OriginalPassword123!', 'password' => $password, 'password_confirmation' => $password])->assertUnprocessable()->assertJsonValidationErrors('password');
        }
        $this->putJson('/api/v1/auth/password', ['currentPassword' => 'OriginalPassword123!', 'password' => 'NewPassword123!', 'password_confirmation' => 'DifferentPassword123!'])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->putJson('/api/v1/auth/password', ['password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertUnprocessable()->assertJsonValidationErrors('currentPassword');
        $this->assertTrue(Hash::check('OriginalPassword123!', $user->fresh()->password));
    }

    public function test_password_changes_end_other_sessions_and_rotate_remember_tokens(): void
    {
        $user = User::factory()->create(['password' => 'OriginalPassword123!']);
        $other = User::factory()->create();
        foreach (['other-device' => $user->id, 'other-user-device' => $other->id] as $id => $userId) {
            DB::table('sessions')->insert(['id' => $id, 'user_id' => $userId, 'payload' => '', 'last_activity' => time()]);
        }
        $token = $user->remember_token;
        $this->actingAs($user)->putJson('/api/v1/auth/password', ['currentPassword' => 'OriginalPassword123!', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertOk();
        $this->assertDatabaseMissing('sessions', ['id' => 'other-device']);
        $this->assertDatabaseHas('sessions', ['id' => 'other-user-device']);
        $this->assertNotSame($token, $user->fresh()->remember_token);
        $this->getJson('/api/v1/me')->assertOk();
    }

    public function test_only_authenticated_verified_enabled_accounts_can_set_a_password(): void
    {
        $payload = ['password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'];
        $this->putJson('/api/v1/auth/password', $payload)->assertUnauthorized();
        $user = User::factory()->unverified()->create(['password' => null]);
        $this->actingAs($user)->putJson('/api/v1/auth/password', $payload)->assertForbidden();
        $user->forceFill(['email_verified_at' => now(), 'disabled_at' => now()])->save();
        $this->actingAs($user)->putJson('/api/v1/auth/password', $payload)->assertForbidden();
        $this->assertNull($user->fresh()->password);
    }

    public function test_password_changes_require_csrf_in_real_web_requests(): void
    {
        $user = User::factory()->create();
        $this->app['env'] = 'local';
        $this->actingAs($user)->putJson('/api/v1/auth/password', ['password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertStatus(419);
    }

    public function test_password_changes_preserve_significant_whitespace(): void
    {
        $user = User::factory()->create(['password' => ' OriginalPassword123! ']);
        $this->actingAs($user)->putJson('/api/v1/auth/password', ['currentPassword' => ' OriginalPassword123! ', 'password' => ' NewPassword123! ', 'password_confirmation' => ' NewPassword123! '])->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => ' NewPassword123! '])->assertOk();
    }
}
