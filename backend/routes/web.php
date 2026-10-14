<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\BusinessController;
use Illuminate\Support\Facades\Route;

// Auth writes always use web/session/CSRF middleware, including non-SPA requests.
Route::prefix('api/v1/auth')->group(function () {
    Route::post('/signup', [AuthController::class, 'signup'])->middleware('throttle:registration')->name('auth.signup');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('auth.login');
    Route::post('/forgot-password', [AuthController::class, 'forgot'])->middleware('throttle:passwords')->name('auth.forgot');
    Route::post('/reset-password', [AuthController::class, 'reset'])->middleware('throttle:passwords')->name('auth.reset');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/session', [AuthController::class, 'session']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::patch('/account', [AuthController::class, 'account'])->name('auth.account');
        Route::post('/verification-notification', [AuthController::class, 'verification'])->middleware('throttle:6,1');
        Route::post('/workspace', [BusinessController::class, 'select'])->middleware('verified');
    });
});
Route::get('/api/v1/me', [AuthController::class, 'session'])->middleware('auth:sanctum');
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verify'])->middleware(['auth:sanctum', 'signed', 'throttle:6,1'])->name('verification.verify');
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('throttle:20,1');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:20,1');
