<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\MembershipController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::post('/businesses', [BusinessController::class, 'store'])->middleware('throttle:10,60');
    Route::middleware('business')->group(function () {
        Route::get('/memberships', [MembershipController::class, 'index']);
        Route::post('/memberships', [MembershipController::class, 'store']);
        Route::patch('/memberships/{id}', [MembershipController::class, 'update']);
        Route::delete('/memberships/{id}', [MembershipController::class, 'destroy']);
        Route::get('/dashboard', DashboardController::class);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
        Route::patch('/appointments/{id}', [AppointmentController::class, 'update']);
        Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
        Route::patch('/appointments/{id}/status', [AppointmentController::class, 'status']);
        Route::get('/calendar', [AppointmentController::class, 'index']);
        Route::get('/availability', [AppointmentController::class, 'availability']);
        foreach (['customers', 'services', 'staff'] as $kind) {
            Route::get('/'.$kind, [DirectoryController::class, 'index'])->defaults('kind', $kind);
            Route::post('/'.$kind, [DirectoryController::class, 'store'])->defaults('kind', $kind);
            Route::get('/'.$kind.'/{id}', [DirectoryController::class, 'show'])->defaults('kind', $kind);
            Route::patch('/'.$kind.'/{id}', [DirectoryController::class, 'update'])->defaults('kind', $kind);
            Route::delete('/'.$kind.'/{id}', [DirectoryController::class, 'destroy'])->defaults('kind', $kind);
        }
        Route::get('/business', [BusinessController::class, 'show']);
        Route::patch('/business', [BusinessController::class, 'update']);
    });
});
