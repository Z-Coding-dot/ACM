<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class Scheduling
{
    public const OCCUPIED = ['scheduled', 'confirmed'];

    public function references(Business $business, array $v): array
    {
        $service = Service::where('business_id', $business->id)->where('active', true)->find($v['serviceId']);
        $staff = isset($v['staffId']) ? StaffMember::with('services')->where('business_id', $business->id)->where('active', true)->find($v['staffId']) : null;
        if (! $service) {
            throw ValidationException::withMessages(['serviceId' => ['error.validation']]);
        }
        if (isset($v['staffId']) && (! $staff || ! $staff->services->contains('id', $service->id))) {
            throw ValidationException::withMessages(['staffId' => ['error.validation']]);
        }
        if (! $staff && ! $business->settings->allow_unassigned) {
            throw ValidationException::withMessages(['staffId' => ['validation.required']]);
        }

        return [$service, $staff];
    }

    public function withinHours(Business $business, ?StaffMember $staff, CarbonImmutable $start, CarbonImmutable $end, bool $align = true): bool
    {
        $local = $start->setTimezone($business->time_zone);
        $day = $local->dayOfWeek;
        $hours = $business->hours->firstWhere('day', $day);
        $h = $hours ? ['open' => substr($hours->open_at, 0, 5), 'close' => substr($hours->close_at, 0, 5), 'closed' => $hours->closed, 'breaks' => $hours->breaks ?? []] : null;
        $sh = $staff ? collect($staff->hours)->firstWhere('day', $day) : null;
        if (! $h || $h['closed'] || ($staff && (! $sh || $sh['closed']))) {
            return false;
        }
        $opening = max($h['open'], $sh['open'] ?? '00:00');
        $minute = fn ($time) => (int) substr($time, 0, 2) * 60 + (int) substr($time, 3, 2);
        if ($align && ($minute($local->format('H:i')) - $minute($opening)) % $business->settings->slot_minutes !== 0) {
            return false;
        }
        // Inspect actual elapsed minutes, including repeated/skipped local times at DST transitions.
        for ($cursor = $start; $cursor->lt($end); $cursor = $cursor->addMinute()) {
            $instant = $cursor->setTimezone($business->time_zone);
            if ($instant->toDateString() !== $local->toDateString()) {
                return false;
            }
            $time = $instant->format('H:i');
            foreach (array_filter([$h, $sh]) as $window) {
                if ($time < $window['open'] || $time >= $window['close']) {
                    return false;
                }
                foreach ($window['breaks'] ?? [] as $break) {
                    if ($time >= $break['open'] && $time < $break['close']) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public function overlaps($appointments, CarbonImmutable $start, CarbonImmutable $end, ?string $staffId, ?string $customerId = null): bool
    {
        return $appointments->contains(fn ($a) => $a->starts_at->lt($end) && $a->ends_at->gt($start) &&
            (($customerId && $a->customer_id === $customerId) || $a->staff_member_id === $staffId));
    }

    public function save(Business $context, array $v, ?string $id = null, ?User $actor = null): Appointment
    {
        return DB::transaction(function () use ($context, $v, $id, $actor) {
            // All scheduling/configuration writes take this same tenant row lock before reading availability.
            $business = Business::with(['settings', 'hours'])->whereKey($context->id)->lockForUpdate()->firstOrFail();
            $a = $id ? Appointment::where('business_id', $business->id)->findOrFail($id) : new Appointment;
            if ($actor) {
                $gate = Gate::forUser($actor);
                if ($id) {
                    $gate->authorize('update', $a);
                } else {
                    $gate->authorize('create', [Appointment::class, $business]);
                }
            }
            if ($id && ! in_array($a->status, self::OCCUPIED, true)) {
                abort(409);
            }
            [$service,$staff] = $this->references($business, $v);
            $customer = Customer::where('business_id', $business->id)->where('active', true)->find($v['customerId']);
            if (! $customer) {
                throw ValidationException::withMessages(['customerId' => ['error.validation']]);
            }
            $start = CarbonImmutable::parse($v['startsAt'])->utc();
            $end = $start->addMinutes($service->duration_minutes);
            if ($start->lte(now()) || $start->gt(now()->addDays(365))) {
                throw ValidationException::withMessages(['startsAt' => ['validation.future']]);
            }
            if (! $this->withinHours($business, $staff, $start, $end)) {
                throw ValidationException::withMessages(['startsAt' => ['validation.hours']]);
            }
            $existing = Appointment::where('business_id', $business->id)->whereIn('status', self::OCCUPIED)->where('starts_at', '<', $end)->where('ends_at', '>', $start)->when($id, fn ($q) => $q->where('id', '!=', $id))->get();
            if ($this->overlaps($existing, $start, $end, $staff?->id, $customer->id)) {
                abort(409);
            }
            $a->forceFill(['business_id' => $business->id, 'customer_id' => $customer->id, 'service_id' => $service->id, 'staff_member_id' => $staff?->id,
                'starts_at' => $start, 'ends_at' => $end, 'status' => $id ? $a->status : ($business->settings->require_confirmation ? 'scheduled' : 'confirmed'), 'notes' => $v['notes'] ?? '',
                'duration_minutes' => $service->duration_minutes, 'price_minor' => $service->price_minor, 'currency' => $service->currency, 'service_name' => $service->name])->save();

            return $a->load(['customer', 'staff']);
        }, 3);
    }

    public function availability(Business $business, array $v): array
    {
        $business->load(['settings', 'hours']);
        [$service,$staff] = $this->references($business, $v);
        if ($exclude = $v['excludeId'] ?? null) {
            Appointment::where('business_id', $business->id)->findOrFail($exclude);
        }
        $day = CarbonImmutable::parse($v['date'], $business->time_zone)->startOfDay();
        if ($day->lt(CarbonImmutable::now($business->time_zone)->startOfDay()) || $day->gt(now()->addDays(365))) {
            return [];
        }
        $start = $day->utc();
        $end = $day->addDay()->utc();
        $appointments = Appointment::where('business_id', $business->id)->whereIn('status', self::OCCUPIED)->where('starts_at', '<', $end)->where('ends_at', '>', $start)->when($exclude, fn ($q) => $q->where('id', '!=', $exclude))->get();
        $slots = [];
        for ($cursor = $start; $cursor->lt($end); $cursor = $cursor->addMinute()) {
            $finish = $cursor->addMinutes($service->duration_minutes);
            if ($cursor->gt(now()) && $this->withinHours($business,$staff,$cursor,$finish) && ! $this->overlaps($appointments,$cursor,$finish,$staff?->id,$v['customerId'] ?? null)) {
                $slots[] = $cursor->toISOString();
            }
        }

        return $slots;
    }
}
