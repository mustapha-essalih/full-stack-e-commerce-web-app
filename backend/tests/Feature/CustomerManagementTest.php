<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerManagementTest extends TestCase
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

    private function adminToken(): string
    {
        return $this->admin->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    private function customerToken(): string
    {
        return $this->customer->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    private function createOrderForUser(User $user, string $status = 'paid', int $totalCents = 3998): Order
    {
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => $status,
            'total_cents' => $totalCents,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'unit_price_cents' => $this->product->price_cents,
            'quantity' => 2,
            'total_cents' => $totalCents,
        ]);

        Payment::factory()->create([
            'order_id' => $order->id,
            'stripe_payment_intent_id' => 'pi_' . fake()->uuid(),
            'amount_cents' => $totalCents,
            'currency' => 'usd',
            'status' => 'succeeded',
        ]);

        return $order->fresh(['items', 'payment']);
    }

    // ─── Customer List ──────────────────────────────────────────────────

    public function test_admin_can_view_customer_list(): void
    {
        User::factory()->count(3)->create()->each->assignRole('customer');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/customers');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['uuid', 'name', 'email', 'is_suspended', 'orders_count', 'total_spent_cents', 'total_spent_formatted', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_customer_list_includes_order_count_and_total_spent(): void
    {
        $this->createOrderForUser($this->customer, 'paid', 5000);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/customers');

        $response->assertOk();
        $customerData = collect($response->json('data'))->firstWhere('uuid', $this->customer->uuid);

        $this->assertNotNull($customerData);
        $this->assertEquals(1, $customerData['orders_count']);
        $this->assertEquals(5000, $customerData['total_spent_cents']);
    }

    public function test_customer_list_can_filter_by_has_orders(): void
    {
        $this->createOrderForUser($this->customer);

        $noOrderUser = User::factory()->create();
        $noOrderUser->assignRole('customer');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/customers?filter[has_orders]=false');

        $response->assertOk();
        $uuids = collect($response->json('data'))->pluck('uuid');
        $this->assertContains($noOrderUser->uuid, $uuids);
        $this->assertNotContains($this->customer->uuid, $uuids);
    }

    public function test_non_admin_cannot_access_customer_list(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->getJson('/api/v1/admin/customers');

        $response->assertStatus(403);
    }

    // ─── Customer Detail ────────────────────────────────────────────────

    public function test_admin_can_view_customer_detail(): void
    {
        $this->createOrderForUser($this->customer);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/customers/{$this->customer->uuid}");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'uuid', 'name', 'email', 'is_suspended',
                    'orders_count', 'total_spent_cents', 'total_spent_formatted',
                    'recent_orders' => [
                        '*' => ['uuid', 'status', 'total_cents', 'created_at'],
                    ],
                ],
            ]);
    }

    public function test_customer_detail_returns_404_for_invalid_uuid(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/customers/non-existent-uuid');

        $response->assertNotFound();
    }

    // ─── Suspend / Reinstate ────────────────────────────────────────────

    public function test_admin_can_suspend_customer(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/customers/{$this->customer->uuid}/suspend");

        $response->assertOk()
            ->assertJsonPath('data.is_suspended', true)
            ->assertJsonPath('message', 'Customer suspended successfully.');
    }

    public function test_suspended_customer_cannot_login(): void
    {
        $this->customer->update(['is_suspended' => true, 'suspended_at' => now()]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $this->customer->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Your account has been suspended. Please contact support.');
    }

    public function test_admin_can_reinstate_suspended_customer(): void
    {
        $this->customer->update(['is_suspended' => true, 'suspended_at' => now()]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/customers/{$this->customer->uuid}/reinstate");

        $response->assertOk()
            ->assertJsonPath('data.is_suspended', false)
            ->assertJsonPath('message', 'Customer reinstated successfully.');
    }

    public function test_cannot_suspend_an_admin_user(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/customers/{$this->admin->uuid}/suspend");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot suspend an admin user.');
    }

    public function test_cannot_suspend_already_suspended_customer(): void
    {
        $this->customer->update(['is_suspended' => true, 'suspended_at' => now()]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/customers/{$this->customer->uuid}/suspend");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Customer is already suspended.');
    }

    public function test_suspension_revokes_tokens(): void
    {
        $token = $this->customer->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $this->customerService()->suspendCustomer($this->customer);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/account/profile');

        $response->assertStatus(401);
    }

    private function customerService(): \App\Services\CustomerService
    {
        return $this->app->make(\App\Services\CustomerService::class);
    }

    private function mockStripeRefund(): void
    {
        $refundMock = \Mockery::mock('alias:' . \Stripe\Refund::class);
        $refundMock->shouldReceive('create')
            ->once()
            ->andReturn(new \stdClass());
    }

    // ─── Order Notes ────────────────────────────────────────────────────

    public function test_admin_can_update_order_notes(): void
    {
        $order = $this->createOrderForUser($this->customer);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->patchJson("/api/v1/admin/orders/{$order->uuid}/notes", [
                'admin_notes' => 'Customer requested rush delivery.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.admin_notes', 'Customer requested rush delivery.')
            ->assertJsonPath('message', 'Order notes updated.');
    }

    public function test_admin_notes_not_visible_to_customer(): void
    {
        $order = $this->createOrderForUser($this->customer);
        $order->admin_notes = 'Internal note about customer issue';
        $order->save();

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken()}")
            ->getJson("/api/v1/orders/{$order->uuid}");

        $response->assertOk();
        $this->assertArrayNotHasKey('admin_notes', $response->json('data'));
    }

    // ─── Order Refund ───────────────────────────────────────────────────

    public function test_admin_can_refund_a_paid_order(): void
    {
        $order = $this->createOrderForUser($this->customer, 'paid');

        $this->mockStripeRefund();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->postJson("/api/v1/admin/orders/{$order->uuid}/refund");

        $response->assertOk()
            ->assertJsonPath('data.status', 'refunded')
            ->assertJsonPath('message', 'Order refunded successfully.');
    }

    public function test_refund_restores_inventory(): void
    {
        $initialStock = $this->product->stock_quantity;
        $order = $this->createOrderForUser($this->customer, 'paid');

        $this->mockStripeRefund();

        $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->postJson("/api/v1/admin/orders/{$order->uuid}/refund");

        $this->assertEquals($initialStock + 2, $this->product->fresh()->stock_quantity);
    }

    public function test_refund_on_pending_order_returns_error(): void
    {
        $order = $this->createOrderForUser($this->customer, 'pending');

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->postJson("/api/v1/admin/orders/{$order->uuid}/refund");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Order cannot be refunded in its current status: pending.');
    }
}
