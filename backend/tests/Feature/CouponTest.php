<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;
    private User $admin;
    private string $sessionId;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->product = Product::factory()->create([
            'price_cents' => 1999,
            'stock_quantity' => 10,
            'is_active' => true,
        ]);

        $this->sessionId = (string) Str::uuid();
    }

    private function initializeCheckout(): string
    {
        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 2,
            ]);

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/checkout/initialize', [
                'address' => [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                    'line1' => '123 Main St',
                    'city' => 'New York',
                    'country_code' => 'US',
                ],
            ]);

        return $response->json('data.order.uuid');
    }

    // --- Checkout Coupon Application ---

    public function test_valid_percentage_coupon_applies_discount(): void
    {
        $coupon = Coupon::factory()->percentage()->create([
            'code' => 'SAVE20',
            'value' => 20,
        ]);

        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'SAVE20',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.order.coupon_code', 'SAVE20')
            ->assertJsonPath('data.discount', 800); // 20% of 3998 = ~800
    }

    public function test_valid_fixed_amount_coupon_applies_discount(): void
    {
        $coupon = Coupon::factory()->fixedAmount()->create([
            'code' => 'FLAT5',
            'value' => 500,
        ]);

        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'FLAT5',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.order.coupon_code', 'FLAT5')
            ->assertJsonPath('data.discount', 500);
    }

    public function test_removing_coupon_clears_discount(): void
    {
        Coupon::factory()->percentage()->create([
            'code' => 'SAVE20',
            'value' => 20,
        ]);

        $orderUuid = $this->initializeCheckout();

        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", ['code' => 'SAVE20']);

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->deleteJson("/api/v1/checkout/{$orderUuid}/coupon");

        $response->assertOk()
            ->assertJsonPath('data.order.coupon_code', null)
            ->assertJsonPath('data.order.discount_cents', 0);
    }

    // --- Rejection Conditions ---

    public function test_rejects_invalid_coupon_code(): void
    {
        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'NONEXISTENT',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Invalid coupon code.');
    }

    public function test_rejects_inactive_coupon(): void
    {
        Coupon::factory()->inactive()->create(['code' => 'INACTIVE']);

        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'INACTIVE',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This coupon is no longer active.');
    }

    public function test_rejects_expired_coupon(): void
    {
        Coupon::factory()->expired()->create(['code' => 'EXPIRED']);

        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'EXPIRED',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This coupon has expired.');
    }

    public function test_rejects_coupon_exceeding_usage_limit(): void
    {
        Coupon::factory()->usageLimited(5)->create([
            'code' => 'USEDUP',
            'usage_limit' => 5,
            'usage_count' => 5,
        ]);

        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'USEDUP',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This coupon has reached its usage limit.');
    }

    public function test_rejects_coupon_below_minimum_order(): void
    {
        Coupon::factory()->percentage()->create([
            'code' => 'MIN5000',
            'minimum_order_cents' => 5000,
            'value' => 10,
        ]);

        $orderUuid = $this->initializeCheckout();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'MIN5000',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Minimum order amount of $50.00 is required for this coupon.');
    }

    // --- Per-Customer Limit ---

    public function test_enforces_per_customer_limit_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $coupon = Coupon::factory()->percentage()->create([
            'code' => 'ONCE',
            'per_customer_limit' => 1,
            'value' => 10,
            'usage_limit' => 100,
        ]);

        // Use the coupon once via a paid order
        CouponUsage::create([
            'coupon_id' => $coupon->id,
            'order_id' => Order::factory()->paid()->create()->id,
            'user_id' => $user->id,
            'discount_cents' => 100,
            'used_at' => now(),
        ]);
        $coupon->increment('usage_count');

        // Try to apply again in checkout
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $initResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/checkout/initialize', [
                'address' => [
                    'first_name' => 'Jane',
                    'last_name' => 'Smith',
                    'line1' => '456 Oak Ave',
                    'city' => 'Los Angeles',
                    'country_code' => 'US',
                ],
            ]);

        $orderUuid = $initResponse->json('data.order.uuid');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/checkout/{$orderUuid}/coupon", [
                'code' => 'ONCE',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You have reached the usage limit for this coupon.');
    }

    // --- Admin CRUD ---

    public function test_admin_can_list_coupons(): void
    {
        Coupon::factory()->count(3)->create();

        $token = $this->admin->createToken('admin-token', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/coupons');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_coupon(): void
    {
        $token = $this->admin->createToken('admin-token', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/coupons', [
                'code' => 'NEWCODE',
                'type' => 'percentage',
                'value' => 15,
                'description' => '15% off everything',
                'usage_limit' => 100,
                'per_customer_limit' => 1,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'NEWCODE')
            ->assertJsonPath('data.value', 15);

        $this->assertDatabaseHas('coupons', [
            'code' => 'NEWCODE',
            'value' => 15,
        ]);
    }

    public function test_admin_can_view_coupon(): void
    {
        $coupon = Coupon::factory()->create();

        $token = $this->admin->createToken('admin-token', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $coupon->id)
            ->assertJsonPath('data.code', $coupon->code);
    }

    public function test_admin_can_update_coupon(): void
    {
        $coupon = Coupon::factory()->create(['code' => 'ORIGINAL']);

        $token = $this->admin->createToken('admin-token', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/admin/coupons/{$coupon->id}", [
                'code' => 'UPDATED',
                'type' => 'fixed_amount',
                'value' => 1000,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.code', 'UPDATED')
            ->assertJsonPath('data.value', 1000);
    }

    public function test_admin_can_archive_coupon(): void
    {
        $coupon = Coupon::factory()->create();

        $token = $this->admin->createToken('admin-token', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Coupon archived successfully.');

        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);
        $this->assertDatabaseHas('coupons', ['id' => $coupon->id, 'is_active' => false]);
    }

    // --- Usage History ---

    public function test_admin_can_view_coupon_usage_history(): void
    {
        $coupon = Coupon::factory()->create();
        $order = Order::factory()->paid()->create();

        CouponUsage::create([
            'coupon_id' => $coupon->id,
            'order_id' => $order->id,
            'user_id' => null,
            'discount_cents' => 500,
            'used_at' => now(),
        ]);

        $token = $this->admin->createToken('admin-token', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/coupons/{$coupon->id}/usages");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.discount_cents', 500);
    }

    // --- Non-admin Access ---

    public function test_non_admin_cannot_access_coupon_admin(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/coupons');

        $response->assertForbidden();
    }
}
