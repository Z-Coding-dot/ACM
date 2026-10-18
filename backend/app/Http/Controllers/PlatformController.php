<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PlatformController extends Controller
{
    public function overview()
    {
        $since = now()->subDays(29)->toDateString();

        return response()->json(['data' => [
            'businesses' => Business::count(), 'users' => User::count(),
            'suspendedBusinesses' => Business::whereNotNull('suspended_at')->count(),
            'disabledUsers' => User::whereNotNull('disabled_at')->count(),
            'appointments' => DB::table('appointments')->count(),
            'customers' => DB::table('customers')->count(),
            'pageViews' => (int) DB::table('page_views')->where('day', '>=', $since)->sum('views'),
            'dailyViews' => DB::table('page_views')->where('day', '>=', $since)->selectRaw('day, SUM(views) as views')->groupBy('day')->orderBy('day')->get(),
            'topPages' => DB::table('page_views')->where('day', '>=', $since)->selectRaw('path, SUM(views) as views')->groupBy('path')->orderByDesc('views')->get(),
            'activityCount' => DB::table('activity_logs')->where('created_at', '>=', now()->subDays(30))->count(),
        ]]);
    }

    public function businesses(Request $request)
    {
        $input = $this->filters($request);
        $query = Business::withCount('memberships');
        $this->search($query, $input['search'] ?? '');

        return $this->page($query->orderByDesc('created_at')->orderBy('id')->paginate(20), fn ($business) => $this->businessData($business));
    }

    public function storeBusiness(Request $request)
    {
        $input = $this->businessInput($request, true);
        $owner = User::where('email', $input['ownerEmail'])->whereNotNull('email_verified_at')->whereNull('disabled_at')->first();
        if (! $owner) {
            throw ValidationException::withMessages(['ownerEmail' => ['platform.ownerHint']]);
        }
        $business = DB::transaction(function () use ($input, $owner) {
            $business = Business::create($this->businessAttributes($input));
            $business->settings()->create(['slot_minutes' => 30, 'allow_unassigned' => true, 'require_confirmation' => false]);
            $business->hours()->createMany(array_map(fn ($day) => ['day' => $day, 'open_at' => '09:00', 'close_at' => '17:00', 'closed' => in_array($day, [0, 6], true), 'breaks' => []], range(0, 6)));
            $business->memberships()->create(['user_id' => $owner->id, 'role' => 'owner']);

            return $business;
        });

        return response()->json(['data' => $this->businessData($business->loadCount('memberships'))], 201);
    }

    public function updateBusiness(Request $request, string $id)
    {
        $input = $this->businessInput($request, false);
        $business = DB::transaction(function () use ($input, $id) {
            $business = Business::whereKey($id)->lockForUpdate()->firstOrFail();
            // Timezone/currency/hours changes remain in the business's scheduling-aware settings.
            $business->fill(['name' => $input['name'], 'email' => $input['email'] ?? '', 'phone' => $input['phone'] ?? '']);
            $business->forceFill(['suspended_at' => $input['suspended'] ? ($business->suspended_at ?? now()) : null])->save();

            return $business;
        });

        return response()->json(['data' => $this->businessData($business->loadCount('memberships'))]);
    }

    public function destroyBusiness(Request $request, string $id)
    {
        $logo = DB::transaction(function () use ($request, $id) {
            $business = Business::whereKey($id)->lockForUpdate()->firstOrFail();
            $request->validate(['confirmation' => ['required', Rule::in([$business->name])]]);
            // Preserve restrictive foreign keys; explicitly remove only this tenant's data.
            foreach (['appointments', 'staff_services', 'staff_members', 'services', 'customers'] as $table) {
                DB::table($table)->where('business_id', $id)->delete();
            }
            $logo = $business->logo_path;
            $business->delete();

            return $logo;
        });
        if ($logo) {
            Storage::disk('local')->delete($logo);
        }

        return response()->noContent();
    }

    public function users(Request $request)
    {
        $input = $this->filters($request);
        $query = User::withCount('memberships');
        $this->search($query, $input['search'] ?? '');

        return $this->page($query->orderByDesc('created_at')->orderBy('id')->paginate(20), fn ($user) => $this->userData($user));
    }

    public function storeUser(Request $request)
    {
        $input = $request->validate([
            'name' => ['required', 'string', 'max:160'], 'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:72'], 'locale' => ['required', Rule::in(['en', 'fa-AF'])],
        ]);
        $input['email'] = mb_strtolower($input['email']);
        $user = User::create($input);
        try {
            $user->sendEmailVerificationNotification();
            $sent = true;
        } catch (\Throwable) {
            $sent = false;
        }

        return response()->json(['data' => $this->userData($user->loadCount('memberships')), 'verificationEmailSent' => $sent], 201);
    }

    public function updateUser(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $input = $request->validate(['name' => ['required', 'string', 'max:160'], 'disabled' => ['required', 'boolean']]);
        DB::transaction(function () use ($user, $input, $request) {
            // Platform administrators are managed only through the server command.
            abort_if($input['disabled'] && ($user->id === $request->user()->id || $user->is_platform_admin), 409);
            $user->fill(['name' => $input['name']]);
            $user->forceFill(['disabled_at' => $input['disabled'] ? ($user->disabled_at ?? now()) : null])->save();
            if ($input['disabled']) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }
        });

        return response()->json(['data' => $this->userData($user->loadCount('memberships'))]);
    }

    public function destroyUser(Request $request, string $id)
    {
        DB::transaction(function () use ($request, $id) {
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
            abort_if($user->id === $request->user()->id || $user->is_platform_admin || $user->memberships()->where('role', 'owner')->exists(), 409);
            $request->validate(['confirmation' => ['required', Rule::in([$user->email])]]);
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->delete();
        });

        return response()->noContent();
    }

    public function activity(Request $request)
    {
        $this->filters($request);
        $query = DB::table('activity_logs as logs')->leftJoin('users', 'logs.actor_id', '=', 'users.id')->leftJoin('businesses', 'logs.business_id', '=', 'businesses.id')
            ->select('logs.*', 'users.name as actor', 'businesses.name as business')->orderByDesc('logs.id');

        return $this->page($query->paginate(20), fn ($row) => ['id' => (string) $row->id, 'actor' => $row->actor, 'business' => $row->business, 'method' => $row->method, 'resource' => $row->resource, 'recordId' => $row->record_id, 'createdAt' => $row->created_at]);
    }

    private function businessInput(Request $request, bool $creating): array
    {
        $rules = ['name' => ['required', 'string', 'max:160'], 'email' => ['nullable', 'email', 'max:254'], 'phone' => ['nullable', 'string', 'max:32']];
        if ($creating) {
            $rules += ['ownerEmail' => ['required', 'email'], 'industry' => ['required', Rule::in(['salon', 'clinic', 'education', 'consulting', 'other'])],
                'timeZone' => ['required', 'timezone:all'], 'currency' => ['required', Rule::in(['AFN', 'USD', 'EUR', 'GBP', 'AED', 'INR', 'PKR', 'JPY'])], 'locale' => ['required', Rule::in(['en', 'fa-AF'])]];
        } else {
            $rules['suspended'] = ['required', 'boolean'];
        }

        return $request->validate($rules);
    }

    private function businessAttributes(array $input): array
    {
        return ['name' => $input['name'], 'email' => $input['email'] ?? '', 'phone' => $input['phone'] ?? '', 'industry' => $input['industry'], 'time_zone' => $input['timeZone'], 'currency' => $input['currency'], 'locale' => $input['locale']];
    }

    private function businessData(Business $business): array
    {
        return ['id' => $business->id, 'name' => $business->name, 'email' => $business->email, 'phone' => $business->phone, 'industry' => $business->industry,
            'timeZone' => $business->time_zone, 'currency' => $business->currency, 'locale' => $business->locale,
            'suspended' => (bool) $business->suspended_at, 'members' => $business->memberships_count ?? 0, 'createdAt' => $business->created_at->toISOString()];
    }

    private function userData(User $user): array
    {
        return ['id' => (string) $user->id, 'name' => $user->name, 'email' => $user->email, 'emailVerified' => $user->hasVerifiedEmail(),
            'platformAdmin' => (bool) $user->is_platform_admin, 'disabled' => (bool) $user->disabled_at, 'memberships' => $user->memberships_count ?? 0, 'createdAt' => $user->created_at->toISOString()];
    }

    private function filters(Request $request): array
    {
        return $request->validate(['search' => ['nullable', 'string', 'max:160'], 'page' => ['sometimes', 'integer', 'min:1', 'max:100000']]);
    }

    private function search($query, string $search): void
    {
        if ($search !== '') {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';
            $query->where(fn ($q) => $q->whereRaw("name LIKE ? ESCAPE '!'", [$like])->orWhereRaw("email LIKE ? ESCAPE '!'", [$like]));
        }
    }

    private function page($page, callable $map)
    {
        return response()->json(['data' => $page->getCollection()->map($map)->all(), 'meta' => ['currentPage' => $page->currentPage(), 'perPage' => $page->perPage(), 'total' => $page->total(), 'lastPage' => $page->lastPage()]]);
    }
}
