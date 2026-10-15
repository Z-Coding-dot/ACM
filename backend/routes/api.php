<?php

use App\Http\Controllers\BusinessController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::post('/businesses', [BusinessController::class, 'store'])->middleware('throttle:10,60');
    Route::middleware('business')->group(function () {
        Route::get('/memberships', [\App\Http\Controllers\MembershipController::class, 'index']);
        Route::post('/memberships', [\App\Http\Controllers\MembershipController::class, 'store']);
        Route::patch('/memberships/{id}', [\App\Http\Controllers\MembershipController::class, 'update']);
        Route::delete('/memberships/{id}', [\App\Http\Controllers\MembershipController::class, 'destroy']);
        Route::get('/dashboard', \App\Http\Controllers\DashboardController::class);
        Route::get('/appointments', [\App\Http\Controllers\AppointmentController::class, 'index']);
        Route::post('/appointments', [\App\Http\Controllers\AppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [\App\Http\Controllers\AppointmentController::class, 'show']);
        Route::patch('/appointments/{id}', [\App\Http\Controllers\AppointmentController::class, 'update']);
        Route::delete('/appointments/{id}', [\App\Http\Controllers\AppointmentController::class, 'destroy']);
        Route::patch('/appointments/{id}/status', [\App\Http\Controllers\AppointmentController::class, 'status']);
        Route::get('/calendar', [\App\Http\Controllers\AppointmentController::class, 'index']);
        Route::get('/availability', [\App\Http\Controllers\AppointmentController::class, 'availability']);
        foreach (['customers', 'services', 'staff'] as $kind) {
            Route::get('/'.$kind, [\App\Http\Controllers\DirectoryController::class, 'index'])->defaults('kind', $kind);
            Route::post('/'.$kind, [\App\Http\Controllers\DirectoryController::class, 'store'])->defaults('kind', $kind);
            Route::get('/'.$kind.'/{id}', [\App\Http\Controllers\DirectoryController::class, 'show'])->defaults('kind', $kind);
            Route::patch('/'.$kind.'/{id}', [\App\Http\Controllers\DirectoryController::class, 'update'])->defaults('kind', $kind);
            Route::delete('/'.$kind.'/{id}', [\App\Http\Controllers\DirectoryController::class, 'destroy'])->defaults('kind', $kind);
        }
        Route::get('/business', [BusinessController::class, 'show']);
        Route::patch('/business', [BusinessController::class, 'update']);
    });
});
