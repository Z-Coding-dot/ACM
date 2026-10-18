<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthRequest;
use App\Models\User;
use App\Services\ReturnDestination;
use App\Services\SessionProfile;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class AuthController extends Controller
{
    public function __construct(private SessionProfile $profiles) {}

    public function session(Request $request)
    {
        return response()->json($this->profiles->for($request->user()));
    }

    public function signup(AuthRequest $request)
    {
        try {
            $user = DB::transaction(fn () => User::create($request->safe()->only(['name', 'email', 'password', 'locale'])));
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['email' => ['validation.emailTaken']]);
        }
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('auth.returnTo', ReturnDestination::safe($request->input('returnTo')));
        $sent = $this->sendVerification($user);

        return response()->json([...$this->profiles->for($user), 'verificationEmailSent' => $sent], 201);
    }

    public function login(AuthRequest $request)
    {
        if (! Auth::guard('web')->attempt($request->safe()->only(['email', 'password']), $request->boolean('remember'))) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }
        $request->session()->regenerate();
        $request->session()->put('auth.returnTo', ReturnDestination::safe($request->input('returnTo')));

        if ($request->user()->disabled_at) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            abort(403);
        }

        return $this->session($request);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return response()->noContent();
    }

    public function forgot(AuthRequest $request)
    {
        // The same public response for registered and unknown addresses.
        try {
            $status = Password::sendResetLink($request->safe()->only(['email']));
        } catch (TransportExceptionInterface $error) {
            Log::warning('Password reset delivery failed.', ['exception' => $error::class]);
            abort(503);
        }
        if (! in_array($status, [Password::RESET_LINK_SENT, Password::INVALID_USER, Password::RESET_THROTTLED], true)) {
            abort(503);
        }

        return response()->noContent();
    }

    public function reset(AuthRequest $request)
    {
        $status = Password::reset($request->validated(), function (User $user, string $password) {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            event(new PasswordReset($user));
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => ['passwords.token']]);
        }
        if (Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            Auth::forgetGuards();
        }

        return response()->noContent();
    }

    public function verification(Request $request)
    {
        if (! $request->user()->hasVerifiedEmail() && ! $this->sendVerification($request->user())) {
            abort(503);
        }

        return response()->noContent();
    }

    public function verify(EmailVerificationRequest $request)
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->markEmailAsVerified();
            event(new Verified($request->user()));
        }

        $destination = ReturnDestination::safe($request->session()->pull('auth.returnTo'));
        $path = $request->user()->memberships()->exists() ? $destination : '/onboarding'.($destination === '/app/overview' ? '' : '?'.http_build_query(['returnTo' => $destination]));

        return redirect(config('acm.frontend_url').$path);
    }

    public function account(AuthRequest $request)
    {
        $user = $request->user();
        $changed = $request->validated('email') !== $user->email;
        if ($changed && (! $user->password || ! Hash::check((string) $request->input('currentPassword'), $user->password))) {
            throw ValidationException::withMessages(['currentPassword' => ['auth.password']]);
        }
        $user->fill($request->safe()->only(['name', 'email']));
        if ($changed) {
            $user->email_verified_at = null;
        }
        try {
            $user->save();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['email' => ['validation.emailTaken']]);
        }
        $sent = $changed ? $this->sendVerification($user) : null;

        return response()->json([...$this->profiles->for($user), 'verificationEmailSent' => $sent]);
    }

    public function password(AuthRequest $request)
    {
        $user = DB::transaction(function () use ($request) {
            // Serialize first-password creation and later changes for this account.
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            if ($user->password && ! Hash::check((string) $request->input('currentPassword'), $user->password)) {
                throw ValidationException::withMessages(['currentPassword' => ['account.passwordIncorrect']]);
            }
            $user->forceFill(['password' => Hash::make($request->validated('password')), 'remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $request->session()->getId())->delete();

            return $user;
        });
        $request->session()->regenerate(true);
        Auth::guard('web')->setUser($user);

        return response()->json($this->profiles->for($user));
    }

    private function sendVerification(User $user): bool
    {
        try {
            $user->sendEmailVerificationNotification();

            return true;
        } catch (\Throwable $error) {
            Log::warning('Email verification delivery failed.', ['exception' => $error::class]);

            return false;
        }
    }
}
