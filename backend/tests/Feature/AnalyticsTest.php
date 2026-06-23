<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Carbon $baseDate;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->baseDate = Carbon::parse('2026-06-15 12:00:00');
    }

    private function adminToken(): string
    {
        return $this->admin->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    public function test_revenue_summary_returns_correct_totals(): void
    {
        $user = User::factory()->create();

        Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 5000,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 3000,
            'created_at' => $this->baseDate->copy()->addDay(),
        ]);
        Order::factory()->delivered()->forUser($user)->create([
            'total_cents' => 2000,
            'created_at' => $this->baseDate->copy()->addDays(2),
        ]);

        Order::factory()->cancelled()->forUser($user)->create([
            'total_cents' => 99999,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->pending()->forUser($user)->create([
            'total_cents' => 88888,
            'created_at' => $this->baseDate,
        ]);

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDays(3)->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/summary?from={$from}&to={$to}");

        $response->assertOk()
            ->assertJsonPath('data.revenue_cents', 10000)
            ->assertJsonPath('data.order_count', 3)
            ->assertJsonPath('data.average_order_value_cents', 3333)
            ->assertJsonStructure([
                'data' => [
                    'revenue_cents',
                    'order_count',
                    'average_order_value_cents',
                    'comparison' => [
                        'revenue_change_cents',
                        'revenue_change_percent',
                        'order_count_change',
                        'order_count_change_percent',
                        'aov_change_cents',
                        'aov_change_percent',
                    ],
                ],
            ]);
    }

    public function test_revenue_summary_excludes_pending_cancelled_refunded(): void
    {
        $user = User::factory()->create();

        Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 1000,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->pending()->forUser($user)->create([
            'total_cents' => 99999,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->cancelled()->forUser($user)->create([
            'total_cents' => 88888,
            'created_at' => $this->baseDate,
        ]);

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDay()->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/summary?from={$from}&to={$to}");

        $response->assertOk()
            ->assertJsonPath('data.revenue_cents', 1000)
            ->assertJsonPath('data.order_count', 1);
    }

    public function test_revenue_chart_returns_daily_series(): void
    {
        $user = User::factory()->create();

        Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 1000,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 2000,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 3000,
            'created_at' => $this->baseDate->copy()->addDay(),
        ]);

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDays(2)->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/revenue-chart?from={$from}&to={$to}");

        $response->assertOk();

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertEquals(3000, $data[0]['revenue_cents']);
        $this->assertEquals(2, $data[0]['order_count']);
        $this->assertEquals(3000, $data[1]['revenue_cents']);
        $this->assertEquals(1, $data[1]['order_count']);
    }

    public function test_top_products_returns_ordered_by_revenue(): void
    {
        $user = User::factory()->create();
        $productA = Product::factory()->create(['name' => 'Product A', 'price_cents' => 1000]);
        $productB = Product::factory()->create(['name' => 'Product B', 'price_cents' => 2000]);

        $order = Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 5000,
            'created_at' => $this->baseDate,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $productA->id,
            'product_name' => $productA->name,
            'product_sku' => $productA->sku,
            'quantity' => 2,
            'unit_price_cents' => 1000,
            'total_cents' => 2000,
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $productB->id,
            'product_name' => $productB->name,
            'product_sku' => $productB->sku,
            'quantity' => 1,
            'unit_price_cents' => 2000,
            'total_cents' => 2000,
        ]);

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDay()->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/top-products?from={$from}&to={$to}");

        $response->assertOk();

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertEquals($productA->name, $data[0]['product_name']);
        $this->assertEquals(2, $data[0]['units_sold']);
    }

    public function test_customers_returns_new_vs_returning(): void
    {
        $newUser = User::factory()->create();
        $returningUser = User::factory()->create();

        Order::factory()->paid()->forUser($returningUser)->create([
            'total_cents' => 1000,
            'created_at' => $this->baseDate->copy()->subMonth(),
        ]);

        Order::factory()->paid()->forUser($newUser)->create([
            'total_cents' => 2000,
            'created_at' => $this->baseDate,
        ]);
        Order::factory()->paid()->forUser($returningUser)->create([
            'total_cents' => 3000,
            'created_at' => $this->baseDate,
        ]);

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDay()->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/customers?from={$from}&to={$to}");

        $response->assertOk()
            ->assertJsonPath('data.new_count', 1)
            ->assertJsonPath('data.returning_count', 1);
    }

    public function test_coupon_summary_returns_usage_data(): void
    {
        $user = User::factory()->create();
        $coupon = Coupon::factory()->create(['code' => 'TEST10']);

        $order = Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 5000,
            'coupon_id' => $coupon->id,
            'coupon_code' => 'TEST10',
            'created_at' => $this->baseDate,
        ]);

        CouponUsage::create([
            'coupon_id' => $coupon->id,
            'order_id' => $order->id,
            'user_id' => $user->id,
            'discount_cents' => 500,
            'used_at' => $this->baseDate,
        ]);

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDay()->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/coupons?from={$from}&to={$to}");

        $response->assertOk()
            ->assertJsonPath('data.unique_coupons_used', 1)
            ->assertJsonPath('data.total_usages', 1)
            ->assertJsonPath('data.total_discount_cents', 500)
            ->assertJsonPath('data.coupons.0.coupon_code', 'TEST10');
    }

    public function test_analytics_requires_date_range(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/analytics/summary');

        $response->assertStatus(422);
    }

    public function test_analytics_requires_admin_role(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/analytics/summary?from=2026-06-01&to=2026-06-30');

        $response->assertStatus(403);
    }

    public function test_top_products_limit_is_respected(): void
    {
        $user = User::factory()->create();
        $products = Product::factory()->count(5)->create();
        $order = Order::factory()->paid()->forUser($user)->create([
            'total_cents' => 10000,
            'created_at' => $this->baseDate,
        ]);

        foreach ($products as $product) {
            OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'quantity' => 1,
                'unit_price_cents' => $product->price_cents,
                'total_cents' => $product->price_cents,
            ]);
        }

        $from = $this->baseDate->copy()->subDay()->toDateString();
        $to = $this->baseDate->copy()->addDay()->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/top-products?from={$from}&to={$to}&limit=3");

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    public function test_empty_period_returns_zeroes(): void
    {
        $from = $this->baseDate->copy()->addMonth()->toDateString();
        $to = $this->baseDate->copy()->addMonth()->addDays(6)->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/summary?from={$from}&to={$to}");

        $response->assertOk()
            ->assertJsonPath('data.revenue_cents', 0)
            ->assertJsonPath('data.order_count', 0)
            ->assertJsonPath('data.average_order_value_cents', 0);
    }

    public function test_revenue_chart_empty_period_returns_empty_array(): void
    {
        $from = $this->baseDate->copy()->addMonth()->toDateString();
        $to = $this->baseDate->copy()->addMonth()->addDays(6)->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/revenue-chart?from={$from}&to={$to}");

        $response->assertOk();
        $this->assertEmpty($response->json('data'));
    }

    public function test_customers_empty_period_returns_zeroes(): void
    {
        $from = $this->baseDate->copy()->addMonth()->toDateString();
        $to = $this->baseDate->copy()->addMonth()->addDays(6)->toDateString();

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/analytics/customers?from={$from}&to={$to}");

        $response->assertOk()
            ->assertJsonPath('data.new_count', 0)
            ->assertJsonPath('data.returning_count', 0);
    }
}
