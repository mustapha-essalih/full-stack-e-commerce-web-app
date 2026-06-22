<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $admin;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->customer = User::factory()->create();
        $this->customer->assignRole('customer');

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->product = Product::factory()->create([
            'price_cents' => 1999,
            'stock_quantity' => 10,
            'is_active' => true,
        ]);
    }

    private function customerToken(): string
    {
        return $this->customer->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    private function adminToken(): string
    {
        return $this->admin->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    private function createOrderWithItems(User $user, string $status = 'pending', int $itemCount = 2): Order
    {
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => $status,
            'subtotal_cents' => $this->product->price_cents * $itemCount,
            'total_cents' => $this->product->price_cents * $itemCount,
        ]);

        for ($i = 0; $i < $itemCount; $i++) {
            OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
                'product_sku' => $this->product->sku,
                'unit_price_cents' => $this->product->price_cents,
                'quantity' => 1,
                'total_cents' => $this->product->price_cents,
            ]);
        }

        return $order->fresh(['items']);
    }

    // ─── Customer Order History ──────────────────────────────────────────

    public function test_customer_can_view_their_orders(): void
    {
        $this->createOrderWithItems($this->customer);
        $this->createOrderWithItems($this->customer);

        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $this->createOrderWithItems($otherUser);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->getJson('/api/v1/orders');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['uuid', 'status', 'total_cents', 'total_formatted', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'total'],
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_customer_can_view_order_detail(): void
    {
        $order = $this->createOrderWithItems($this->customer);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->getJson("/api/v1/orders/{$order->uuid}");

        $response->assertOk()
            ->assertJsonPath('data.uuid', $order->uuid)
            ->assertJsonStructure([
                'data' => [
                    'uuid', 'status', 'items' => [
                        '*' => ['product_name', 'product_sku', 'quantity', 'unit_price_cents', 'total_cents'],
                    ],
                ],
            ]);
    }

    public function test_customer_cannot_view_another_users_order(): void
    {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $order = $this->createOrderWithItems($otherUser);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->getJson("/api/v1/orders/{$order->uuid}");

        $response->assertNotFound();
    }

    public function test_unauthenticated_user_cannot_access_orders(): void
    {
        $response = $this->getJson('/api/v1/orders');

        $response->assertStatus(401);
    }

    // ─── Customer Cancel ─────────────────────────────────────────────────

    public function test_customer_can_cancel_pending_order(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'pending');

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->postJson("/api/v1/orders/{$order->uuid}/cancel");

        $response->assertOk()
            ->assertJsonPath('data.status', OrderStatus::Cancelled->value);
    }

    public function test_customer_can_cancel_paid_order(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'paid');

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->postJson("/api/v1/orders/{$order->uuid}/cancel");

        $response->assertOk()
            ->assertJsonPath('data.status', OrderStatus::Cancelled->value);
    }

    public function test_customer_cannot_cancel_shipped_order(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'shipped');

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->postJson("/api/v1/orders/{$order->uuid}/cancel");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This order cannot be cancelled.');
    }

    // ─── Admin Order Management ──────────────────────────────────────────

    public function test_admin_can_view_all_orders(): void
    {
        $this->createOrderWithItems($this->customer);
        $this->createOrderWithItems($this->customer);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/orders');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_filter_orders_by_status(): void
    {
        $this->createOrderWithItems($this->customer, 'pending');
        $this->createOrderWithItems($this->customer, 'shipped');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/orders?filter[status]=shipped');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'shipped');
    }

    public function test_admin_can_view_order_detail(): void
    {
        $order = $this->createOrderWithItems($this->customer);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/orders/{$order->uuid}");

        $response->assertOk()
            ->assertJsonPath('data.uuid', $order->uuid);
    }

    public function test_non_admin_cannot_access_admin_orders(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->getJson('/api/v1/admin/orders');

        $response->assertStatus(403);
    }

    // ─── Status Transitions ───────────────────────────────────────────────

    public function test_admin_can_transition_order_to_processing(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'paid');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/orders/{$order->uuid}/status", [
                'status' => 'processing',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'processing');
    }

    public function test_admin_can_ship_order_with_tracking_number(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'processing');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/orders/{$order->uuid}/status", [
                'status' => 'shipped',
                'tracking_number' => '1Z999AA10123456784',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.tracking_number', '1Z999AA10123456784');
    }

    public function test_admin_can_mark_order_delivered(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'shipped');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/orders/{$order->uuid}/status", [
                'status' => 'delivered',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'delivered');
    }

    public function test_invalid_status_transition_returns_422(): void
    {
        $order = $this->createOrderWithItems($this->customer, 'pending');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/orders/{$order->uuid}/status", [
                'status' => 'shipped',
            ]);

        $response->assertStatus(422);
    }

    // ─── Inventory ───────────────────────────────────────────────────────

    public function test_order_creation_decrements_inventory(): void
    {
        $initialStock = $this->product->stock_quantity;

        $cart = Cart::factory()->create();
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 3,
            'unit_price_cents' => $this->product->price_cents,
        ]);

        $service = $this->app->make(\App\Services\OrderService::class);
        $service->createFromCheckout($cart, [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'line1' => '123 Main St',
            'city' => 'New York',
            'country_code' => 'US',
        ], $this->customer);

        $this->assertEquals($initialStock - 3, $this->product->fresh()->stock_quantity);
    }

    public function test_order_cancellation_restores_inventory(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->customer->id,
            'status' => 'paid',
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'quantity' => 2,
            'unit_price_cents' => $this->product->price_cents,
            'total_cents' => $this->product->price_cents * 2,
        ]);

        $initialStock = $this->product->stock_quantity;

        $service = $this->app->make(\App\Services\OrderService::class);
        $service->cancelOrder($order);

        $this->assertEquals($initialStock + 2, $this->product->fresh()->stock_quantity);
    }

    // ─── Order items snapshot ────────────────────────────────────────────

    public function test_order_items_snapshot_product_name_and_sku(): void
    {
        $initialStock = $this->product->stock_quantity;

        $cart = Cart::factory()->create();
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_price_cents' => $this->product->price_cents,
        ]);

        $service = $this->app->make(\App\Services\OrderService::class);
        $order = $service->createFromCheckout($cart, [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'line1' => '123 Main St',
            'city' => 'New York',
            'country_code' => 'US',
        ], $this->customer);

        $item = $order->items->first();

        $this->assertNotNull($item);
        $this->assertEquals($this->product->name, $item->product_name);
        $this->assertEquals($this->product->sku, $item->product_sku);

        $originalName = $item->product_name;
        $originalSku = $item->product_sku;

        // Rename the product to verify snapshot is preserved
        $this->product->update(['name' => 'Renamed Product', 'sku' => 'NEWSKU']);
        $item->refresh();

        $this->assertEquals($originalName, $item->product_name);
        $this->assertEquals($originalSku, $item->product_sku);
        $this->assertNotEquals($this->product->name, $item->product_name);
    }

    public function test_create_from_checkout_clears_cart(): void
    {
        $cart = Cart::factory()->create();
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_price_cents' => $this->product->price_cents,
        ]);

        $service = $this->app->make(\App\Services\OrderService::class);
        $service->createFromCheckout($cart, [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'line1' => '123 Main St',
            'city' => 'New York',
            'country_code' => 'US',
        ], $this->customer);

        $this->assertEquals(0, $cart->fresh()->items()->count());
    }
}
