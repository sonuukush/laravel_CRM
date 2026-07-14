<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Sanctum Authenticated)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/photo', [AuthController::class, 'updatePhoto']);

    // Dashboard Statistics
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);

    // Customer CRUD
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Lead Management & Conversion
    Route::get('/leads', [LeadController::class, 'index']);
    Route::put('/leads/{id}/convert', [LeadController::class, 'convert']);

    // Activities / Follow-ups
    Route::get('/customers/{id}/activities', [ActivityController::class, 'getCustomerActivities']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::put('/activities/{id}', [ActivityController::class, 'update']);

    // Deals Tracking
    Route::get('/deals', [DealController::class, 'index']);
    Route::post('/deals', [DealController::class, 'store']);
    Route::put('/deals/{id}', [DealController::class, 'update']);
    Route::patch('/deals/{id}/stage', [DealController::class, 'updateStage']);

    // Document Management
    Route::post('/documents/upload', [DocumentController::class, 'upload']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    // Reports & Exports
    Route::get('/reports/sales-performance', [ReportController::class, 'salesPerformance'])->middleware('role:Admin|Manager');
    Route::get('/reports/export/excel', [ReportController::class, 'exportExcel']);
    Route::get('/reports/export/pdf', [ReportController::class, 'exportPdf']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Users List for Admin and Managers (to assign/reassign leads)
    Route::get('/users', [UserController::class, 'index'])->middleware('role:Admin|Manager');

    // Admin-Only User Management
    Route::middleware('role:Admin')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/assign-role', [UserController::class, 'assignRole']);
    });
});
