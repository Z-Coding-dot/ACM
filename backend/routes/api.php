<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\BusinessLogoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\PlatformController;
use App\Http\Controllers\PublicContentController;
use App\Http\Middleware\EnsureAccountEnabled;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\RecordActivity;
use Illuminate\Support\Facades\Route;

Route::get('/v1/public/content', [PublicContentController::class, 'published']);
Route::post('/v1/public/page-views', [PublicContentController::class, 'pageView'])->middleware('throttle:60,1');

Route::prefix('v1')->middleware(['auth:sanctum', 'verified', EnsureAccountEnabled::class, RecordActivity::class])->group(function () {
    Route::get('/businesses/{id}/logo', [BusinessLogoController::class, 'show']);
    Route::prefix('platform')->middleware(EnsurePlatformAdmin::class)->group(function () {
        Route::get('/overview', [PlatformController::class, 'overview']);
        Route::get('/businesses', [PlatformController::class, 'businesses']);
        Route::post('/businesses', [PlatformController::class, 'storeBusiness']);
        Route::patch('/businesses/{id}', [PlatformController::class, 'updateBusiness']);
        Route::delete('/businesses/{id}', [PlatformController::class, 'destroyBusiness']);
        Route::get('/users', [PlatformController::class, 'users']);
        Route::post('/users', [PlatformController::class, 'storeUser']);
        Route::patch('/users/{id}', [PlatformController::class, 'updateUser']);
        Route::delete('/users/{id}', [PlatformController::class, 'destroyUser']);
        Route::get('/activity', [PlatformController::class, 'activity']);
        Route::get('/content', [PublicContentController::class, 'index']);
        Route::put('/content/{key}', [PublicContentController::class, 'update']);
        Route::delete('/content/{key}', [PublicContentController::class, 'destroy']);
    });
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::post('/businesses', [BusinessController::class, 'store'])->middleware('throttle:10,60');
    Route::middleware('business')->group(function () {
        Route::get('/memberships', [MembershipController::class, 'index']);
        Route::post('/memberships', [MembershipController::class, 'store']);
        Route::post('/memberships/accounts', [MembershipController::class, 'createAccount'])->middleware('throttle:30,60');
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
        Route::post('/business/logo', [BusinessLogoController::class, 'store']);
        Route::delete('/business/logo', [BusinessLogoController::class, 'destroy']);
    });
});
