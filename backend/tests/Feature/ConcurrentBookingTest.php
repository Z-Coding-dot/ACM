<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class ConcurrentBookingTest extends TestCase
{
    use DatabaseMigrations;

    public function test_two_independent_php_processes_cannot_book_the_same_mysql_slot(): void
    {
        $business = $this->actingAs(User::factory()->create())->postJson('/api/v1/businesses', BusinessTest::input())->json('activeBusinessId');
        $this->withHeader('X-Business-ID', $business);
        $customer = $this->postJson('/api/v1/customers', DirectoryTest::contact())->json('data.id');
        $service = $this->postJson('/api/v1/services', DirectoryTest::service())->json('data.id');
        $date = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0)->toISOString();
        $dir = storage_path('framework/testing/booking-'.bin2hex(random_bytes(8)));
        mkdir($dir, 0700, true);
        $job = $dir.'/job.json';
        $release = $dir.'/release';
        file_put_contents($job, json_encode(['businessId' => $business, 'input' => ['customerId' => $customer, 'serviceId' => $service, 'staffId' => null, 'startsAt' => $date, 'notes' => '']], JSON_THROW_ON_ERROR));
        $workers = [];
        try {
            for ($i = 0; $i < 2; $i++) {
                $process = proc_open([PHP_BINARY, base_path('tests/Support/book-worker.php'), $job, $dir.'/ready-'.$i, $release], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, base_path(), array_merge(getenv(), ['APP_ENV' => 'testing']));
                $this->assertIsResource($process);
                fclose($pipes[0]);
                $workers[] = [$process, $pipes];
            }
            $deadline = microtime(true) + 20;
            while (! file_exists($dir.'/ready-0') || ! file_exists($dir.'/ready-1')) {
                if (microtime(true) > $deadline) {
                    $this->fail('Independent booking workers did not become ready.');
                }
                usleep(10000);
            }
            file_put_contents($release, 'start');
            $statuses = [];
            foreach ($workers as [$process,$pipes]) {
                $statuses[] = trim(stream_get_contents($pipes[1]));
                $error = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                $this->assertSame(0, proc_close($process), $error);
            }
            $workers = [];
            sort($statuses);
            $this->assertSame(['201', '409'], $statuses);
            $this->assertDatabaseCount('appointments', 1);
        } finally {
            foreach ($workers as [$process,$pipes]) {
                proc_terminate($process);
                foreach ($pipes as $pipe) {
                    if (is_resource($pipe)) {
                        fclose($pipe);
                    }
                } proc_close($process);
            }
            foreach (glob($dir.'/*') as $file) {
                unlink($file);
            } rmdir($dir);
        }
    }
}
