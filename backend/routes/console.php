<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::command('auth:clear-resets')->daily();
Schedule::call(function () {
    DB::table('page_views')->where('day', '<', now()->subDays(400)->toDateString())->delete();
    DB::table('activity_logs')->where('created_at', '<', now()->subDays(365))->delete();
})->daily();
