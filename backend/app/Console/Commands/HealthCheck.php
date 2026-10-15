<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
class HealthCheck extends Command {
    protected $signature='acm:health';
    protected $description='Check database connectivity and writable Laravel runtime directories';
    public function handle(): int {
        try {
            DB::select('SELECT 1'); DB::table('migrations')->count(); DB::table('sessions')->limit(1)->count();
            return is_writable(storage_path('framework/views')) && is_writable(base_path('bootstrap/cache')) ? self::SUCCESS : self::FAILURE;
        } catch (\Throwable) { return self::FAILURE; }
    }
}
