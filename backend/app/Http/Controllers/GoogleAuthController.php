<?php

namespace App\Http\Controllers;

use App\Models\ExternalIdentity;
use App\Models\User;
use App\Services\ReturnDestination;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request)
    {
        if (Auth::guard('web')->check()) {
            return redirect(config('acm.frontend_url').'/app/overview');
        }
        if (! config('services.google.client_id') || ! config('services.google.client_secret') || ! config('services.google.redirect')) {
            return $this->failed($request, 'unavailable');
        }
        $request->session()->regenerate();
        $request->session()->put('oauth.returnTo', ReturnDestination::safe($request->query('returnTo')));
        $request->session()->put('oauth.startedAt', now()->timestamp);
        $request->session()->put('oauth.locale', in_array($request->query('locale'), ['en', 'fa-AF'], true) ? $request->query('locale') : 'en');

        return $this->provider($request)->redirect();
    }

    public function callback(Request $request)
    {
        $started = $request->session()->pull('oauth.startedAt');
        $returnTo = ReturnDestination::safe($request->session()->pull('oauth.returnTo'));
        $locale = $request->session()->pull('oauth.locale', 'en');
        if (! is_int($started) || now()->timestamp - $started > 600 || $started > now()->timestamp || Auth::guard('web')->check()) {
            return $this->failed($request, 'state');
        }
        $state = $request->query('state');
        $expected = $request->session()->get('state');
        if (! is_string($state) || ! is_string($expected) || ! hash_equals($expected, $state)) {
            return $this->failed($request, 'state');
        }
        if ($request->has('error')) {
            return $this->failed($request, 'denied');
        }
        if (! is_string($request->query('code')) || strlen($request->query('code')) > 4096) {
            return $this->failed($request, 'state');
        }

        try {
            // Stateful Socialite validates and consumes state again; never stateless().
            $providerUser = $this->provider($request)->user();
            $id = $providerUser->getId();
            $email = $providerUser->getEmail();
            $raw = $providerUser->getRaw();
            if (! is_string($id) || ! $id || strlen($id) > 191 || ! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL) || ($raw['email_verified'] ?? false) !== true) {
                return $this->failed($request, 'identity');
            }
            $email = mb_strtolower(trim($email));
            $name = is_string($providerUser->getName()) ? trim($providerUser->getName()) : '';
            $name = Str::limit($name ?: Str::before($email, '@'), 160, '');
            try {
                $user = DB::transaction(function () use ($id, $email, $name, $locale) {
                    $identity = ExternalIdentity::where('provider', 'google')->where('provider_id', $id)->lockForUpdate()->first();
                    if ($identity) {
                        return $identity->user;
                    }
                    if (User::where('email', $email)->exists()) {
                        throw new \DomainException('Account linking requires separate authentication.');
                    }
                    $user = User::create(['name' => $name, 'email' => $email, 'password' => null, 'locale' => $locale]);
                    $user->forceFill(['email_verified_at' => now()])->save();
                    ExternalIdentity::create(['user_id' => $user->id, 'provider' => 'google', 'provider_id' => $id]);

                    return $user;
                }, 3);
            } catch (UniqueConstraintViolationException) {
                $user = ExternalIdentity::where('provider', 'google')->where('provider_id', $id)->first()?->user;
                if (! $user) {
                    return $this->failed($request, 'link_required');
                }
            }
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
            $request->session()->forget('code_verifier');

            return redirect(config('acm.frontend_url').$returnTo);
        } catch (InvalidStateException) {
            return $this->failed($request, 'state');
        } catch (\DomainException) {
            return $this->failed($request, 'link_required');
        } catch (\Throwable $error) {
            Log::warning('Google authentication failed.', ['exception' => $error::class]);

            return $this->failed($request, 'unavailable');
        }
    }

    private function provider(Request $request)
    {
        // Clear cached request/user objects between requests in long-lived workers/tests.
        Socialite::forgetDrivers();

        return Socialite::driver('google')->setRequest($request)->setScopes(['openid', 'profile', 'email'])->enablePKCE();
    }

    private function failed(Request $request, string $code)
    {
        $request->session()->forget(['state', 'code_verifier', 'oauth']);

        return redirect(config('acm.frontend_url').'/login?oauth='.$code);
    }
}
