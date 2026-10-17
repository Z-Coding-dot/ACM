<?php

use App\Models\Appointment;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Explicit, isolated browser fixtures; never loaded by a route or production seeder.
require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->loadEnvironmentFrom('.env.browser');
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('browser') || config('database.default') !== 'mysql' || config('database.connections.mysql.database') !== 'acm_e2e_test') {
    exit(2);
}
$input = json_decode(file_get_contents($argv[1]), true, 512, JSON_THROW_ON_ERROR);
$map = DB::transaction(function () use ($input) {
    $user = User::create(['name' => 'Zia Parsa', 'email' => $input['email'], 'password' => $input['password'], 'locale' => 'en']);
    $user->forceFill(['email_verified_at' => now()])->save();
    $map = [];
    foreach ($input['fixtures']['businesses'] as $b) {
        $business = Business::create(['name' => $b['name'], 'industry' => $b['industry'], 'email' => $b['email'], 'phone' => $b['phone'], 'time_zone' => $b['timeZone'], 'currency' => $b['currency'], 'locale' => $b['locale']]);
        $map[$b['id']] = $business->id;
        $business->memberships()->create(['user_id' => $user->id, 'role' => 'owner']);
        $business->settings()->create(['slot_minutes' => $b['appointmentSettings']['slotMinutes'], 'allow_unassigned' => $b['appointmentSettings']['allowUnassigned'], 'require_confirmation' => $b['appointmentSettings']['requireConfirmation']]);
        $business->hours()->createMany(array_map(fn ($h) => ['day' => $h['day'], 'open_at' => $h['open'], 'close_at' => $h['close'], 'closed' => $h['closed'], 'breaks' => $h['breaks'] ?? []], $b['hours']));
    }
    foreach ($input['fixtures']['customers'] as $c) {
        $row = new Customer;
        $row->forceFill(['business_id' => $map[$c['businessId']], 'name' => $c['name'], 'email' => $c['email'], 'phone' => $c['phone'], 'notes' => $c['notes'], 'created_at' => $c['createdAt'], 'fingerprint' => hash('sha256', $c['id'])])->save();
        $map[$c['id']] = $row->id;
    }
    foreach ($input['fixtures']['services'] as $s) {
        $row = new Service;
        $row->forceFill(['business_id' => $map[$s['businessId']], 'name' => $s['name'], 'description' => $s['description'], 'duration_minutes' => $s['durationMinutes'], 'price_minor' => $s['priceMinor'], 'currency' => $s['currency'], 'active' => $s['active']])->save();
        $map[$s['id']] = $row->id;
    }
    foreach ($input['fixtures']['staff'] as $s) {
        $row = new StaffMember;
        $row->forceFill(['business_id' => $map[$s['businessId']], 'name' => $s['name'], 'email' => $s['email'], 'phone' => $s['phone'], 'hours' => $s['hours'], 'active' => $s['active']])->save();
        $map[$s['id']] = $row->id;
        $row->services()->sync(array_fill_keys(array_map(fn ($id) => $map[$id], $s['serviceIds']), ['business_id' => $row->business_id]));
    }
    foreach ($input['fixtures']['appointments'] as $a) {
        $service = Service::findOrFail($map[$a['serviceId']]);
        $row = new Appointment;
        $row->forceFill(['business_id' => $map[$a['businessId']], 'customer_id' => $map[$a['customerId']], 'service_id' => $service->id, 'staff_member_id' => $map[$a['staffId']],
            'starts_at' => CarbonImmutable::parse($a['startsAt'])->utc(), 'ends_at' => CarbonImmutable::parse($a['endsAt'])->utc(), 'status' => $a['status'], 'notes' => $a['notes'],
            'service_name' => $service->name, 'duration_minutes' => $service->duration_minutes, 'price_minor' => $service->price_minor, 'currency' => $service->currency])->save();
        $map[$a['id']] = $row->id;
    }
    $user->forceFill(['active_business_id' => reset($map)])->save();

    return $map;
});
echo json_encode(['ids' => $map], JSON_THROW_ON_ERROR);
