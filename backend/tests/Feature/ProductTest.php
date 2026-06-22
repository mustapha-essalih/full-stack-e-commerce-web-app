<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    public function test_public_can_list_products(): void
    {
        Product::factory()->count(3)->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/products');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links',
            ])
            ->assertJsonPath('meta.total', 3);
    }

    public function test_public_can_filter_products_by_category(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['is_active' => true]);
        $product->categories()->attach($category);

        Product::factory()->count(2)->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/products?category_id=' . $category->id);

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_public_can_filter_products_by_price_range(): void
    {
        Product::factory()->create(['price_cents' => 1000, 'is_active' => true]);
        Product::factory()->create(['price_cents' => 5000, 'is_active' => true]);
        Product::factory()->create(['price_cents' => 10000, 'is_active' => true]);

        $response = $this->getJson('/api/v1/products?min_price=3000&max_price=7000');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_public_can_filter_products_by_stock(): void
    {
        Product::factory()->create(['stock_quantity' => 0, 'is_active' => true]);
        Product::factory()->count(2)->create(['stock_quantity' => 10, 'is_active' => true]);

        $response = $this->getJson('/api/v1/products?in_stock=true');

        $response->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_public_can_search_products(): void
    {
        Product::factory()->create(['name' => 'Wireless Headphones', 'is_active' => true]);
        Product::factory()->create(['name' => 'Laptop Stand', 'is_active' => true]);
        Product::factory()->create(['name' => 'Phone Case', 'is_active' => true]);

        $response = $this->getJson('/api/v1/products?search=headphones');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_public_can_sort_products_by_price(): void
    {
        Product::factory()->create(['price_cents' => 99999, 'is_active' => true]);
        Product::factory()->create(['price_cents' => 1999, 'is_active' => true]);
        Product::factory()->create(['price_cents' => 4999, 'is_active' => true]);

        $response = $this->getJson('/api/v1/products?sort=price_cents&direction=asc');

        $response->assertOk();
        $prices = collect($response->json('data'))->pluck('price_cents');
        $this->assertTrue($prices[0] <= $prices[1]);
    }

    public function test_public_can_view_product_detail(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $category = Category::factory()->create();
        $product->categories()->attach($category);

        $response = $this->getJson("/api/v1/products/{$product->slug}");

        $response->assertOk()
            ->assertJsonPath('data.product.uuid', $product->uuid)
            ->assertJsonStructure([
                'data' => [
                    'product' => ['uuid', 'name', 'slug', 'price_cents', 'price_formatted'],
                    'related',
                ],
            ]);
    }

    public function test_public_can_list_featured_products(): void
    {
        Product::factory()->count(3)->featured()->create(['is_active' => true, 'stock_quantity' => 10]);
        Product::factory()->create(['is_featured' => false, 'is_active' => true]);

        $response = $this->getJson('/api/v1/products/featured');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_product(): void
    {
        $category = Category::factory()->create();

        $data = [
            'name' => 'New Product',
            'price_cents' => 4999,
            'sku' => 'NP-001',
            'stock_quantity' => 10,
            'category_ids' => [$category->id],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/products', $data);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'New Product')
            ->assertJsonPath('data.price_cents', 4999);

        $this->assertDatabaseHas('products', ['sku' => 'NP-001']);
    }

    public function test_admin_can_update_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/products/{$product->id}", [
                'name' => 'Updated Product',
                'price_cents' => 9999,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Product')
            ->assertJsonPath('data.price_cents', 9999);
    }

    public function test_admin_can_delete_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/products/{$product->id}");

        $response->assertOk();
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_admin_can_restore_product(): void
    {
        $product = Product::factory()->create();
        $product->delete();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/products/{$product->id}/restore");

        $response->assertOk();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    public function test_unauthenticated_user_cannot_create_product(): void
    {
        $response = $this->postJson('/api/v1/admin/products', [
            'name' => 'Test',
            'price_cents' => 1000,
            'sku' => 'TEST',
        ]);

        $response->assertUnauthorized();
    }

    public function test_product_detail_shows_price_formatted(): void
    {
        $product = Product::factory()->create([
            'price_cents' => 1999,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/products/{$product->slug}");

        $response->assertOk()
            ->assertJsonPath('data.product.price_cents', 1999)
            ->assertJsonPath('data.product.price_formatted', '$19.99');
    }
}
