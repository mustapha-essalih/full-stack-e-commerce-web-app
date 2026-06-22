<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Store\CategoryController as StoreCategoryController;
use App\Http\Controllers\Store\ProductController as StoreProductController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', function () {
    return response()->json([
        'status' => 'ok',
        'version' => '1.0.0',
    ]);
});

Route::group(['prefix' => 'v1/auth'], function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/refresh', [AuthController::class, 'refresh']);

    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])
        ->middleware('throttle:5,1');
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'sendVerification']);
        Route::post('/email/verify', [EmailVerificationController::class, 'verify'])->name('verification.verify');

        Route::middleware(['role:admin'])->group(function (): void {
            Route::get('/admin/check', function () {
                return response()->json(['data' => ['admin' => true]]);
            });
        });
    });
});

// Public store routes
Route::group(['prefix' => 'v1'], function (): void {
    Route::get('/categories', [StoreCategoryController::class, 'index']);
    Route::get('/categories/{slug}', [StoreCategoryController::class, 'show']);

    Route::get('/products', [StoreProductController::class, 'index']);
    Route::get('/products/featured', [StoreProductController::class, 'featured']);
    Route::get('/products/{slug}', [StoreProductController::class, 'show']);
});

// Cart routes (mixed auth — guest and authenticated)
Route::group(['prefix' => 'v1/cart'], function (): void {
    Route::get('/', [CartController::class, 'show']);
    Route::post('/items', [CartController::class, 'addItem']);
    Route::patch('/items/{cartItem}', [CartController::class, 'updateItemQuantity']);
    Route::delete('/items/{cartItem}', [CartController::class, 'removeItem']);
    Route::delete('/', [CartController::class, 'clear']);
});

// Admin routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function (): void {
    Route::group(['prefix' => 'v1/admin'], function (): void {
        // Categories
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::get('/categories/{category}', [AdminCategoryController::class, 'show']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::patch('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        // Products
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::get('/products/{product}', [AdminProductController::class, 'show']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::patch('/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);
        Route::post('/products/{product}/restore', [AdminProductController::class, 'restore']);

        // Product images
        Route::post('/products/{product}/images', [AdminProductController::class, 'uploadImages']);
        Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'destroyImage']);
        Route::patch('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages']);
    });
});

// Checkout routes
Route::group(['prefix' => 'v1/checkout'], function (): void {
    Route::post('/initialize', [CheckoutController::class, 'initialize']);
    Route::get('/{orderUuid}', [CheckoutController::class, 'show']);
    Route::post('/{orderUuid}/coupon', [CheckoutController::class, 'applyCoupon']);
    Route::delete('/{orderUuid}/coupon', [CheckoutController::class, 'removeCoupon']);
    Route::post('/{orderUuid}/payment-intent', [CheckoutController::class, 'createPaymentIntent']);
});

// Stripe webhook (unauthenticated, signature-verified inside controller)
Route::post('/v1/webhooks/stripe', [StripeWebhookController::class, 'handle']);
