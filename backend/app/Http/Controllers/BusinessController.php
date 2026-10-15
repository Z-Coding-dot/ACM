<?php

namespace App\Http\Controllers;

use App\Enums\BusinessRole;
use App\Http\Requests\BusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use App\Services\SessionProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BusinessController extends Controller
{
    public function index(Request $request, SessionProfile $profiles)
    {
        return response()->json(['data' => $profiles->for($request->user())['businesses']]);
    }

    public function store(BusinessRequest $request, SessionProfile $profiles)
    {
        Gate::authorize('create', Business::class);
        DB::transaction(function () use ($request) {
            $owner = \App\Models\User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            abort_unless($owner->hasVerifiedEmail(),403);
            $limit = config('acm.limits.businesses');
            if ($limit !== null && $request->user()->memberships()->where('role', 'owner')->count() >= $limit) abort(response()->json(['code'=>'error.planLimit'],409));
            $input = $request->validated();
            $business = Business::create($this->attributes($input));
            $business->memberships()->create(['user_id' => $request->user()->id, 'role' => BusinessRole::Owner]);
            $this->configuration($business, $input);
            $request->user()->forceFill(['active_business_id' => $business->id])->save();
        });

        return response()->json($profiles->for($request->user()->fresh()), 201);
    }

    public function select(Request $request, SessionProfile $profiles)
    {
        $input = $request->validate(['businessId' => ['required', 'string', 'size:26']]);
        abort_unless($request->user()->memberships()->where('business_id', $input['businessId'])->exists(), 404);
        $request->user()->forceFill(['active_business_id' => $input['businessId']])->save();

        return response()->json($profiles->for($request->user()->fresh()));
    }

    public function show(Request $request)
    {
        Gate::authorize('view', $request->attributes->get('business'));
        return response()->json(['data' => BusinessResource::data($request->attributes->get('business'), $request->attributes->get('membership'))]);
    }

    public function update(BusinessRequest $request)
    {
        $business = $request->attributes->get('business');
        Gate::authorize('update', $business);
        DB::transaction(function () use ($request, $business) {
            $business = Business::whereKey($business->id)->lockForUpdate()->firstOrFail();
            Gate::authorize('update',$business);
            $input = $request->validated();
            $business->update($this->attributes($input));
            $this->configuration($business, $input);
            $business->load(['settings', 'hours']);
            $bookings = \App\Models\Appointment::with('staff')->where('business_id', $business->id)->whereIn('status', \App\Services\Scheduling::OCCUPIED)->where('ends_at', '>', now())->get();
            foreach ($bookings as $booking) {
                if (!app(\App\Services\Scheduling::class)->withinHours($business, $booking->staff, $booking->starts_at, $booking->ends_at, false)) abort(response()->json(['code'=>'error.scheduleInUse'],409));
            }
        });

        return response()->json(['data' => BusinessResource::data($business->fresh(), $request->attributes->get('membership'))]);
    }

    private function attributes(array $input): array
    {
        return ['name' => $input['name'], 'industry' => $input['industry'], 'email' => $input['email'] ?? '', 'phone' => $input['phone'] ?? '', 'time_zone' => $input['timeZone'], 'currency' => $input['currency'], 'locale' => $input['locale']];
    }

    private function configuration(Business $business, array $input): void
    {
        $settings = $input['appointmentSettings'];
        $business->settings()->updateOrCreate(['business_id' => $business->id], ['slot_minutes' => $settings['slotMinutes'], 'allow_unassigned' => $settings['allowUnassigned'], 'require_confirmation' => $settings['requireConfirmation']]);
        $business->hours()->delete();
        $business->hours()->createMany(array_map(fn ($hour) => ['day' => $hour['day'], 'open_at' => $hour['open'], 'close_at' => $hour['close'], 'closed' => $hour['closed'], 'breaks' => $hour['breaks'] ?? []], $input['hours']));
    }
}
