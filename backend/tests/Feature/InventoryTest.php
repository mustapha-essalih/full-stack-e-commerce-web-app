<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\InventoryAdjustmentType;
use App\Events\LowStockDetected;
use App\Exceptions\InsufficientStockException;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private InventoryService $inventoryService;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->inventoryService = $this->app->make(InventoryService::class);
    }

    private function adminToken(): string
    {
        return $this->admin->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    public function test_adjust_stock_increases_quantity(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $this->inventoryService->adjustStock(
            $product,
            5,
            InventoryAdjustmentType::Restock,
            $this->admin,
            'Restocked from supplier',
        );

        $this->assertEquals(15, $product->fresh()->stock_quantity);

        $adjustment = InventoryAdjustment::where('product_id', $product->id)->first();
        $this->assertNotNull($adjustment);
        $this->assertEquals(5, $adjustment->quantity_change);
        $this->assertEquals(15, $adjustment->quantity_after);
        $this->assertEquals(InventoryAdjustmentType::Restock->value, $adjustment->type);
        $this->assertEquals($this->admin->id, $adjustment->user_id);
        $this->assertEquals('Restocked from supplier', $adjustment->note);
    }

    public function test_adjust_stock_decreases_quantity(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $this->inventoryService->adjustStock(
            $product,
            -3,
            InventoryAdjustmentType::Adjustment,
            $this->admin,
            'Manual reduction',
        );

        $this->assertEquals(7, $product->fresh()->stock_quantity);
    }

    public function test_adjust_stock_throws_when_quantity_would_go_negative(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 5]);

        $this->expectException(InsufficientStockException::class);

        $this->inventoryService->adjustStock(
            $product,
            -10,
            InventoryAdjustmentType::Adjustment,
        );
    }

    public function test_reserve_stock_decrements_and_records_sale(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $this->inventoryService->reserveStock($product, 3);

        $this->assertEquals(7, $product->fresh()->stock_quantity);

        $adjustment = InventoryAdjustment::where('product_id', $product->id)->first();
        $this->assertNotNull($adjustment);
        $this->assertEquals(-3, $adjustment->quantity_change);
        $this->assertEquals(7, $adjustment->quantity_after);
        $this->assertEquals(InventoryAdjustmentType::Sale->value, $adjustment->type);
    }

    public function test_reserve_prevents_overselling(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 1]);

        $this->inventoryService->reserveStock($product, 1);

        $this->assertEquals(0, $product->fresh()->stock_quantity);

        $this->expectException(InsufficientStockException::class);
        $this->inventoryService->reserveStock($product->fresh(), 1);
    }

    public function test_concurrent_reservation_race_condition(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 1]);

        $exception = null;

        DB::transaction(function () use ($product, &$exception): void {
            $this->inventoryService->reserveStock($product, 1);

            try {
                $this->inventoryService->reserveStock($product->fresh(), 1);
            } catch (InsufficientStockException $e) {
                $exception = $e;
            }
        });

        $this->assertNotNull($exception);
        $this->assertEquals(1, $product->fresh()->stock_quantity);
    }

    public function test_low_stock_threshold_fires_event(): void
    {
        Event::fake();

        $product = Product::factory()->create(['stock_quantity' => 15]);

        $this->inventoryService->adjustStock(
            $product,
            -10,
            InventoryAdjustmentType::Adjustment,
        );

        Event::assertDispatched(LowStockDetected::class, function (LowStockDetected $event) use ($product): bool {
            return $event->product->id === $product->id && $event->currentQuantity === 5;
        });
    }

    public function test_low_stock_event_not_fired_above_threshold(): void
    {
        Event::fake();

        $product = Product::factory()->create(['stock_quantity' => 20]);

        $this->inventoryService->adjustStock(
            $product,
            -5,
            InventoryAdjustmentType::Adjustment,
        );

        Event::assertNotDispatched(LowStockDetected::class);
    }

    public function test_get_low_stock_products_returns_only_below_threshold(): void
    {
        Product::factory()->create(['stock_quantity' => 3]);
        Product::factory()->create(['stock_quantity' => 9]);
        Product::factory()->create(['stock_quantity' => 10]);
        Product::factory()->create(['stock_quantity' => 25]);

        $lowStockProducts = $this->inventoryService->getLowStockProducts();

        $this->assertCount(2, $lowStockProducts);
    }

    public function test_get_adjustment_history_is_paginated(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 100]);

        for ($i = 0; $i < 20; $i++) {
            $this->inventoryService->adjustStock(
                $product,
                -1,
                InventoryAdjustmentType::Sale,
            );
        }

        $history = $this->inventoryService->getAdjustmentHistory($product, 10);

        $this->assertEquals(20, $history->total());
        $this->assertCount(10, $history->items());
        $this->assertEquals(2, $history->lastPage());
    }

    public function test_every_stock_change_records_adjustment(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 100]);

        $this->inventoryService->adjustStock($product, 10, InventoryAdjustmentType::Restock, $this->admin, 'Restock');
        $this->inventoryService->adjustStock($product, -5, InventoryAdjustmentType::Sale);
        $this->inventoryService->adjustStock($product, -2, InventoryAdjustmentType::Adjustment, $this->admin, 'Correction');

        $this->assertEquals(3, InventoryAdjustment::where('product_id', $product->id)->count());
        $this->assertEquals(103, $product->fresh()->stock_quantity);
    }

    public function test_admin_can_view_low_stock_via_api(): void
    {
        Product::factory()->create(['stock_quantity' => 3, 'name' => 'Low Stock Item']);
        Product::factory()->create(['stock_quantity' => 25, 'name' => 'Well Stocked']);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson('/api/v1/admin/inventory/low-stock');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.count', 1);
    }

    public function test_admin_can_adjust_stock_via_api(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->postJson("/api/v1/admin/inventory/{$product->id}/adjust", [
                'type' => 'restock',
                'quantity' => 5,
                'note' => 'Supplier delivery',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.stock_quantity', 15);

        $this->assertEquals(15, $product->fresh()->stock_quantity);
    }

    public function test_admin_can_view_adjustment_history_via_api(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 100]);

        $this->inventoryService->adjustStock($product, -1, InventoryAdjustmentType::Sale);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->getJson("/api/v1/admin/inventory/{$product->id}/history");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'type', 'quantity_change', 'quantity_after', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_non_admin_cannot_access_inventory_endpoints(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/inventory/low-stock');

        $response->assertStatus(403);
    }

    public function test_adjust_stock_validates_type(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken()}")
            ->postJson("/api/v1/admin/inventory/{$product->id}/adjust", [
                'type' => 'invalid-type',
                'quantity' => 5,
            ]);

        $response->assertStatus(422);
    }
}
