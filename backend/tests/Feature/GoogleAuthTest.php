<?php

namespace Tests\Feature;

use App\Models\ExternalIdentity;
use App\Models\User;
use App\Services\ReturnDestination;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google' => ['client_id' => 'test-client', 'client_secret' => 'test-only-secret', 'redirect' => 'http://127.0.0.1:8000/auth/google/callback']]);
    }

    private function provider(array $identity): void
    {
        $handler = new MockHandler([
            new Response(200, [], json_encode(['access_token' => 'test-only-provider-token', 'token_type' => 'Bearer', 'expires_in' => 3600])),
            new Response(200, [], json_encode($identity)),
        ]);
        $client = new Client(['handler' => HandlerStack::create($handler)]);
        Socialite::extend('google', fn ($app) => (new GoogleProvider($app['request'], 'test-client', 'test-only-secret', 'http://127.0.0.1:8000/auth/google/callback'))->setHttpClient($client));
    }

    private function start(string $returnTo = '/app/overview'): string
    {
        $response = $this->get('/auth/google/redirect?'.http_build_query(['returnTo' => $returnTo]))->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame('openid profile email', $query['scope']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertSame('http://127.0.0.1:8000/auth/google/callback', $query['redirect_uri']);

        return $query['state'];
    }

    public function test_verified_google_identity_registers_a_user_and_a_normal_session(): void
    {
        $this->provider(['sub' => 'google-123', 'email' => 'google@example.test', 'email_verified' => true, 'name' => 'Google Owner']);
        $state = $this->start('/app/calendar?view=week#schedule');
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect('http://127.0.0.1:5173/app/calendar?view=week#schedule');
        $user = User::where('email', 'google@example.test')->firstOrFail();
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertNull($user->password);
        $this->assertDatabaseHas('external_identities', ['user_id' => $user->id, 'provider_id' => 'google-123']);
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('businesses', [])->assertJsonMissing(['token' => 'test-only-provider-token']);
    }

    public function test_existing_google_identity_is_resolved_by_provider_id_instead_of_email(): void
    {
        $user = User::factory()->create(['email' => 'original@example.test']);
        ExternalIdentity::create(['user_id' => $user->id, 'provider' => 'google', 'provider_id' => 'google-123']);
        $this->provider(['sub' => 'google-123', 'email' => 'changed-provider-email@example.test', 'email_verified' => true]);
        $state = $this->start();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect('http://127.0.0.1:5173/app/overview');
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseCount('users', 1);
        $this->assertSame('original@example.test', $user->fresh()->email);
    }

    public function test_a_google_signup_can_set_a_password_then_use_both_password_and_google_login(): void
    {
        $identity = ['sub' => 'google-password-123', 'email' => 'google-password@example.test', 'email_verified' => true, 'name' => 'Google Owner'];
        $this->provider($identity);
        $state = $this->start();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect();
        $user = User::where('email', $identity['email'])->firstOrFail();
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('user.hasPassword', false);
        $this->putJson('/api/v1/auth/password', ['password' => 'GoogleLocal123!', 'password_confirmation' => 'GoogleLocal123!'])->assertOk()->assertJsonPath('user.hasPassword', true);
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->postJson('/api/v1/auth/login', ['email' => $identity['email'], 'password' => 'GoogleLocal123!'])->assertOk()->assertJsonPath('user.id', (string) $user->id);
        // First-password creation cannot be reused to bypass current-password checks.
        $this->putJson('/api/v1/auth/password', ['password' => 'AnotherPassword123!', 'password_confirmation' => 'AnotherPassword123!'])->assertUnprocessable()->assertJsonValidationErrors('currentPassword');
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->provider($identity);
        $state = $this->start();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect();
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('external_identities', ['user_id' => $user->id, 'provider_id' => $identity['sub']]);
    }

    public function test_matching_local_email_is_never_silently_linked(): void
    {
        User::factory()->create(['email' => 'owner@example.test']);
        $this->provider(['sub' => 'google-123', 'email' => 'owner@example.test', 'email_verified' => true]);
        $state = $this->start();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect('http://127.0.0.1:5173/login?oauth=link_required');
        $this->assertGuest('web');
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('external_identities', 0);
    }

    public function test_unverified_provider_email_is_rejected(): void
    {
        $this->provider(['sub' => 'google-123', 'email' => 'owner@example.test', 'email_verified' => false]);
        $state = $this->start();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect('http://127.0.0.1:5173/login?oauth=identity');
        $this->assertGuest('web');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_denied_consent_has_a_safe_error_and_consumes_state(): void
    {
        $state = $this->start();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'error' => 'access_denied']))->assertRedirect('http://127.0.0.1:5173/login?oauth=denied');
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'replay']))->assertRedirect('http://127.0.0.1:5173/login?oauth=state');
        $this->assertGuest('web');
    }

    public function test_invalid_and_expired_state_are_rejected_before_provider_calls(): void
    {
        $this->start();
        $this->get('/auth/google/callback?state=invalid&code=provider-code')->assertRedirect('http://127.0.0.1:5173/login?oauth=state');
        $state = $this->start();
        $this->travel(11)->minutes();
        $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect('http://127.0.0.1:5173/login?oauth=state');
        $this->assertGuest('web');
    }

    public function test_missing_credentials_produce_an_unavailable_result(): void
    {
        config(['services.google.client_secret' => '']);
        $this->get('/auth/google/redirect')->assertRedirect('http://127.0.0.1:5173/login?oauth=unavailable');
    }

    public function test_provider_failures_show_a_callback_error_and_log_only_safe_diagnostics(): void
    {
        Log::spy();
        foreach (['invalid_client' => 'invalid_client', 'invalid_grant' => 'invalid_grant', 'untrusted-private-error' => 'unknown'] as $providerError => $loggedError) {
            $client = new Client(['handler' => HandlerStack::create(new MockHandler([
                new Response(401, [], json_encode(['error' => $providerError, 'error_description' => 'private-provider-details', 'access_token' => 'private-token'])),
            ]))]);
            Socialite::extend('google', fn ($app) => (new GoogleProvider($app['request'], 'test-client', 'test-only-secret', 'http://127.0.0.1:8000/auth/google/callback'))->setHttpClient($client));
            $state = $this->start();
            $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'private-code']))->assertRedirect('http://127.0.0.1:5173/login?oauth=failed');
            $this->assertGuest('web');
            Log::shouldHaveReceived('warning')->with('Google authentication failed.', [
                'exception' => ClientException::class,
                'http_status' => 401,
                'provider_error' => $loggedError,
            ])->once();
            $this->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'private-code']))->assertRedirect('http://127.0.0.1:5173/login?oauth=state');
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_authenticated_accounts_cannot_be_overwritten_by_an_oauth_callback(): void
    {
        $state = $this->start();
        $user = User::factory()->create();
        $this->actingAs($user, 'web')->get('/auth/google/callback?'.http_build_query(['state' => $state, 'code' => 'provider-code']))->assertRedirect('http://127.0.0.1:5173/login?oauth=state');
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_external_and_traversal_return_destinations_are_rejected(): void
    {
        foreach (['https://evil.example', '//evil.example', 'https://evil.example/platform', '//evil.example/platform', '/platform/../login', '/app/../login', '/app/%252e%252e/login', '/app/overview\\evil', '/app/overview%0aHeader'] as $destination) {
            $this->assertSame('/app/overview', ReturnDestination::safe($destination));
        }
        $this->assertSame('/app/calendar?view=week#schedule', ReturnDestination::safe('/app/calendar?view=week#schedule'));
        $this->assertSame('/platform', ReturnDestination::safe('/platform'));
        $this->assertSame('/platform/content?locale=en', ReturnDestination::safe('/platform/content?locale=en'));
    }
}
