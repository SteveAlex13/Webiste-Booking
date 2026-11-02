<?php

use App\Http\Controllers\Api\V1\AdminDashboardController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AvailabilityController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\MidtransWebhookController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ServiceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // 1. Authentication (Public)
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // 2. Public Service & Category Browsing
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{id}', [ServiceController::class, 'show']);
    Route::get('/services/{id}/availability', [AvailabilityController::class, 'check']);

    // 3. Webhooks (Midtrans) - Not protected by sanctum
    Route::post('/webhooks/midtrans', [MidtransWebhookController::class, 'handle']);

    // 4. Authenticated Routes (Customer + Admin)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::put('/user/profile', [AuthController::class, 'updateProfile']);

        // Customer Booking
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

        // Payments
        Route::post('/payments/checkout', [PaymentController::class, 'checkout']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
        Route::get('/payments/{id}/status', [PaymentController::class, 'checkStatus']);

        // 5. Admin & Super Admin Protected Routes
        Route::prefix('admin')->middleware('role:admin,super_admin')->group(function () {
            // Dashboard & Analytics
            Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);
            Route::get('/reports', [AdminDashboardController::class, 'reports']);

            // Category Management
            Route::get('/categories', [CategoryController::class, 'adminIndex']);
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{id}', [CategoryController::class, 'update']);
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

            // Service Management
            Route::get('/services', [ServiceController::class, 'adminIndex']);
            Route::post('/services', [ServiceController::class, 'store']);
            Route::put('/services/{id}', [ServiceController::class, 'update']);
            Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

            // Schedule Management
            Route::get('/business-hours', [AdminDashboardController::class, 'businessHours']);
            Route::post('/business-hours', [AdminDashboardController::class, 'updateBusinessHours']);
            Route::get('/schedule-exceptions', [AdminDashboardController::class, 'scheduleExceptions']);
            Route::post('/schedule-exceptions', [AdminDashboardController::class, 'storeScheduleException']);
            Route::delete('/schedule-exceptions/{id}', [AdminDashboardController::class, 'destroyScheduleException']);

            // Slots Management
            Route::get('/booking-slots', [AdminDashboardController::class, 'bookingSlots']);
            Route::post('/booking-slots/generate', [AdminDashboardController::class, 'generateSlots']);

            // Bookings Management
            Route::get('/bookings', [BookingController::class, 'adminIndex']);
            Route::get('/bookings/{id}', [BookingController::class, 'show']);
            Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);

            // Customers & Payments List
            Route::get('/customers', [AdminDashboardController::class, 'customers']);
            Route::get('/payments', [PaymentController::class, 'adminIndex']);
        });
    });
});
