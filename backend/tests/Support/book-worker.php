<?php

use App\Models\Business;
use App\Services\Scheduling;
use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\HttpKernel\Exception\HttpException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.default') !== 'mysql' || ! str_ends_with(config('database.connections.mysql.database'), '_test')) {
    exit(2);
}
$job = json_decode(file_get_contents($argv[1]), true, 512, JSON_THROW_ON_ERROR);
file_put_contents($argv[2], 'ready');
$deadline = microtime(true) + 20;
while (! file_exists($argv[3])) {
    if (microtime(true) > $deadline) {
        exit(3);
    } usleep(10000);
}
try {
    $business = Business::findOrFail($job['businessId']);
    $app->make(Scheduling::class)->save($business, $job['input']);
    echo '201';
} catch (HttpException $error) {
    echo $error->getStatusCode();
} catch (Throwable $error) {
    // No request payload, credentials or SQL bindings in worker output.
    fwrite(STDERR, $error::class);
    exit(4);
}
