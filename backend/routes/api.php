<?php

use App\Http\Controllers\BusinessController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::post('/businesses', [BusinessController::class, 'store'])->middleware('throttle:10,60');
    Route::middleware('business')->group(function () {
        Route::get('/business', [BusinessController::class, 'show']);
        Route::patch('/business', [BusinessController::class, 'update']);
    });
});
