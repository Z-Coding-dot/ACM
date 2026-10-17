<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_signup_creates_a_hashed_unverified_account_and_session_without_a_business(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/signup', ['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'role' => 'owner'])
            ->assertCreated()->assertJsonPath('businesses', [])->assertJsonPath('user.emailVerified', false)->assertJsonPath('verificationEmailSent', true);
        $user = User::where('email', 'owner@example.test')->firstOrFail();
        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertNull($user->email_verified_at);
        $this->assertAuthenticatedAs($user);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->getJson('/api/v1/auth/session')->assertOk()->assertJsonMissing(['password' => $user->password]);
    }

    public function test_duplicate_email_and_password_confirmation_are_validated(): void
    {
        User::factory()->create(['email' => 'owner@example.test']);
        $this->postJson('/api/v1/auth/signup', ['name' => 'Owner', 'email' => 'OWNER@example.test', 'password' => 'Password123!', 'password_confirmation' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_uses_real_credentials_and_logout_ends_the_session(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.test', 'password' => 'Password123!']);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123!', 'remember' => true])->assertOk()->assertJsonPath('user.id', (string) $user->id);
        $this->assertAuthenticatedAs($user);
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertGuest();
        $this->getJson('/api/v1/auth/session')->assertUnauthorized();
    }

    public function test_unknown_and_wrong_credentials_have_the_same_generic_response(): void
    {
        User::factory()->create(['email' => 'owner@example.test']);
        $known = $this->postJson('/api/v1/auth/login', ['email' => 'owner@example.test', 'password' => 'wrong'])->assertUnauthorized()->json();
        $unknown = $this->postJson('/api/v1/auth/login', ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertUnauthorized()->json();
        $this->assertSame($known, $unknown);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertUnauthorized();
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertTooManyRequests();
    }

    public function test_password_reset_is_delivered_and_the_token_cannot_be_reused(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'owner@example.test']);
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertNoContent();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.test'])->assertNoContent();
        $notification = Notification::sent($user, ResetPassword::class)->first();
        $this->assertNotNull($notification);
        $payload = ['email' => $user->email, 'token' => $notification->token, 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'];
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertNoContent();
        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertUnprocessable();
    }

    public function test_invalid_password_reset_tokens_are_rejected(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/reset-password', ['email' => $user->email, 'token' => 'invalid', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertUnprocessable()->assertJsonValidationErrors('token');
    }

    public function test_signed_email_verification_checks_the_current_account_and_signature(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->actingAs($user)->get($url)->assertRedirect('http://127.0.0.1:5173/onboarding');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $other = User::factory()->unverified()->create();
        $this->actingAs($other)->get($url)->assertForbidden();
        $this->assertFalse($other->fresh()->hasVerifiedEmail());
    }

    public function test_account_email_changes_require_password_and_clear_verification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['password' => 'Password123!']);
        $this->actingAs($user)->patchJson('/api/v1/auth/account', ['name' => 'Changed', 'email' => 'changed@example.test'])->assertUnprocessable()->assertJsonValidationErrors('currentPassword');
        $this->patchJson('/api/v1/auth/account', ['name' => 'Changed', 'email' => 'changed@example.test', 'currentPassword' => 'Password123!'])->assertOk()->assertJsonPath('user.emailVerified', false);
        $this->assertNull($user->fresh()->email_verified_at);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_protected_profile_requires_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_real_web_csrf_middleware_rejects_auth_writes_without_a_token(): void
    {
        $this->app['env'] = 'local';
        $this->postJson('/api/v1/auth/login', ['email' => 'owner@example.test', 'password' => 'Password123!'])->assertStatus(419);
    }

    public function test_malformed_registration_types_are_validation_errors_and_never_create_accounts(): void
    {
        $this->postJson('/api/v1/auth/signup', ['name' => 'Owner', 'email' => [], 'password' => [], 'password_confirmation' => [], 'locale' => ['en']])->assertUnprocessable();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_bearer_tokens_are_not_an_alternative_to_the_spa_session(): void
    {
        $this->withHeader('Authorization', 'Bearer unsupported-token')->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_safe_return_destination_survives_email_verification_and_unsafe_urls_do_not(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/signup', ['name' => 'Owner', 'email' => 'return@example.test', 'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'returnTo' => '/app/customers/new?source=signup'])->assertCreated();
        $user = User::where('email', 'return@example.test')->firstOrFail();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($url)->assertRedirect('http://127.0.0.1:5173/onboarding?'.http_build_query(['returnTo' => '/app/customers/new?source=signup']));
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123!', 'returnTo' => 'https://evil.example/app/overview'])->assertOk();
        $this->assertSame('/app/overview', session('auth.returnTo'));
        $this->postJson('/api/v1/auth/login', ['email' => [], 'password' => 'Password123!'])->assertUnprocessable();
    }
}
