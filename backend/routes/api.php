<?php

declare(strict_types=1);

use App\Http\Controllers\Account\AddressController as AccountAddressController;
use App\Http\Controllers\Account\ProfileController as AccountProfileController;
use App\Http\Controllers\Account\ReviewController as AccountReviewController;
use App\Http\Controllers\Account\WishlistController as AccountWishlistController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\Store\CategoryController as StoreCategoryController;
use App\Http\Controllers\Store\ProductController as StoreProductController;
use App\Http\Controllers\Store\ReviewController as StoreReviewController;
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
    Route::get('/products/{slug}/reviews', [StoreReviewController::class, 'index']);
});

// Cart routes (mixed auth — guest and authenticated)
Route::group(['prefix' => 'v1/cart'], function (): void {
    Route::get('/', [CartController::class, 'show']);
    Route::post('/items', [CartController::class, 'addItem']);
    Route::patch('/items/{cartItem}', [CartController::class, 'updateItemQuantity']);
    Route::delete('/items/{cartItem}', [CartController::class, 'removeItem']);
    Route::delete('/', [CartController::class, 'clear']);
});

// Customer order routes
Route::middleware('auth:sanctum')->group(function (): void {
    Route::group(['prefix' => 'v1/orders'], function (): void {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{uuid}', [OrderController::class, 'show']);
        Route::post('/{uuid}/cancel', [OrderController::class, 'cancel']);
    });
});

// Account routes (authenticated)
Route::middleware('auth:sanctum')->group(function (): void {
    Route::group(['prefix' => 'v1/account'], function (): void {
        Route::get('/profile', [AccountProfileController::class, 'show']);
        Route::patch('/profile', [AccountProfileController::class, 'update']);
        Route::patch('/password', [AccountProfileController::class, 'updatePassword']);

        Route::get('/addresses', [AccountAddressController::class, 'index']);
        Route::post('/addresses', [AccountAddressController::class, 'store']);
        Route::put('/addresses/{address}', [AccountAddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AccountAddressController::class, 'destroy']);
        Route::patch('/addresses/{address}/default', [AccountAddressController::class, 'setDefault']);

        Route::get('/wishlist', [AccountWishlistController::class, 'index']);
        Route::post('/wishlist', [AccountWishlistController::class, 'store']);
        Route::delete('/wishlist', [AccountWishlistController::class, 'destroy']);

        Route::get('/reviews', [AccountReviewController::class, 'index']);
    });
});

// Authenticated product review routes
Route::middleware('auth:sanctum')->group(function (): void {
    Route::group(['prefix' => 'v1/products'], function (): void {
        Route::get('/{slug}/reviews/eligibility', [StoreReviewController::class, 'eligibility']);
        Route::post('/{slug}/reviews', [AccountReviewController::class, 'store']);
    });
});

// Admin routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function (): void {
    Route::group(['prefix' => 'v1/admin'], function (): void {
        // Categories
        Route::get('/categories/tree', [AdminCategoryController::class, 'tree']);
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::get('/categories/{category}', [AdminCategoryController::class, 'show']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::patch('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        // Products
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::post('/products/bulk-action', [AdminProductController::class, 'bulkAction']);
        Route::get('/products/{product}', [AdminProductController::class, 'show']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::patch('/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);
        Route::post('/products/{product}/restore', [AdminProductController::class, 'restore']);

        // Product images
        Route::post('/products/{product}/images', [AdminProductController::class, 'uploadImages']);
        Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'destroyImage']);
        Route::patch('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages']);

        // Orders
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{uuid}', [AdminOrderController::class, 'show']);
        Route::patch('/orders/{uuid}/status', [AdminOrderController::class, 'updateStatus']);
        Route::patch('/orders/{uuid}/notes', [AdminOrderController::class, 'updateNotes']);
        Route::post('/orders/{uuid}/refund', [AdminOrderController::class, 'refund']);

        // Customers
        Route::get('/customers', [AdminCustomerController::class, 'index']);
        Route::get('/customers/{uuid}', [AdminCustomerController::class, 'show']);
        Route::patch('/customers/{uuid}/suspend', [AdminCustomerController::class, 'suspend']);
        Route::patch('/customers/{uuid}/reinstate', [AdminCustomerController::class, 'reinstate']);

        // Inventory
        Route::get('/inventory/low-stock', [AdminInventoryController::class, 'lowStock']);
        Route::post('/inventory/{productId}/adjust', [AdminInventoryController::class, 'adjust']);
        Route::get('/inventory/{productId}/history', [AdminInventoryController::class, 'history']);

        // Coupons
        Route::get('/coupons', [AdminCouponController::class, 'index']);
        Route::post('/coupons', [AdminCouponController::class, 'store']);
        Route::get('/coupons/{coupon}', [AdminCouponController::class, 'show']);
        Route::put('/coupons/{coupon}', [AdminCouponController::class, 'update']);
        Route::patch('/coupons/{coupon}', [AdminCouponController::class, 'update']);
        Route::delete('/coupons/{coupon}', [AdminCouponController::class, 'destroy']);
        Route::get('/coupons/{coupon}/usages', [AdminCouponController::class, 'usages']);

        // Reviews
        Route::get('/reviews', [AdminReviewController::class, 'index']);
        Route::patch('/reviews/{review}/approve', [AdminReviewController::class, 'approve']);
        Route::patch('/reviews/{review}/reject', [AdminReviewController::class, 'reject']);
        Route::patch('/reviews/{review}/flag', [AdminReviewController::class, 'flag']);

        // Analytics
        Route::get('/analytics/summary', [AdminAnalyticsController::class, 'summary']);
        Route::get('/analytics/revenue-chart', [AdminAnalyticsController::class, 'revenueChart']);
        Route::get('/analytics/top-products', [AdminAnalyticsController::class, 'topProducts']);
        Route::get('/analytics/customers', [AdminAnalyticsController::class, 'customers']);
        Route::get('/analytics/coupons', [AdminAnalyticsController::class, 'coupons']);
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
