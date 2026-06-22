<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;
    private string $sessionId;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->product = Product::factory()->create([
            'price_cents' => 1999,
            'stock_quantity' => 10,
            'is_active' => true,
        ]);

        $this->sessionId = (string) Str::uuid();
    }

    public function test_guest_can_view_empty_cart(): void
    {
        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->getJson('/api/v1/cart');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['uuid', 'items', 'total_cents', 'item_count'],
            ])
            ->assertJsonPath('data.item_count', 0)
            ->assertJsonPath('data.total_cents', 0);
    }

    public function test_guest_can_add_item_to_cart(): void
    {
        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 2,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.cart.item_count', 2)
            ->assertJsonPath('data.cart.total_cents', 3998);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price_cents' => 1999,
        ]);
    }

    public function test_guest_cart_persists_across_requests(): void
    {
        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->getJson('/api/v1/cart');

        $response->assertOk()
            ->assertJsonPath('data.item_count', 1);
    }

    public function test_adding_more_than_available_stock_returns_422(): void
    {
        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 100,
            ]);

        $response->assertStatus(422);
    }

    public function test_guest_can_update_item_quantity(): void
    {
        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $cart = Cart::where('session_id', $this->sessionId)->first();
        $item = $cart->items()->first();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->patchJson("/api/v1/cart/items/{$item->id}", [
                'quantity' => 3,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.item_count', 3)
            ->assertJsonPath('data.total_cents', 5997);
    }

    public function test_guest_can_remove_item(): void
    {
        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $cart = Cart::where('session_id', $this->sessionId)->first();
        $item = $cart->items()->first();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->deleteJson("/api/v1/cart/items/{$item->id}");

        $response->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }

    public function test_guest_can_clear_cart(): void
    {
        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 2,
            ]);

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->deleteJson('/api/v1/cart');

        $response->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }

    public function test_authenticated_user_cart_persists(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/cart');

        $response->assertOk()
            ->assertJsonPath('data.item_count', 1);
    }

    public function test_guest_cart_merges_into_user_cart_on_login(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('Password123!'),
        ]);
        $user->assignRole('customer');

        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 2,
            ]);

        $secondProduct = Product::factory()->create([
            'price_cents' => 999,
            'stock_quantity' => 5,
            'is_active' => true,
        ]);

        $userCart = Cart::factory()->forUser($user)->create();
        CartItem::factory()->create([
            'cart_id' => $userCart->id,
            'product_id' => $secondProduct->id,
            'quantity' => 1,
            'unit_price_cents' => 999,
        ]);

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/auth/login', [
                'email' => 'john@example.com',
                'password' => 'Password123!',
            ]);

        $response->assertOk();

        $this->assertDatabaseMissing('carts', ['session_id' => $this->sessionId]);

        $mergedCart = Cart::where('user_id', $user->id)->first();
        $this->assertNotNull($mergedCart);

        $mergedItems = $mergedCart->items()->get();
        $this->assertCount(2, $mergedItems);
    }

    public function test_merge_guest_cart_without_duplicates(): void
    {
        $user = User::factory()->create([
            'email' => 'jane@example.com',
            'password' => bcrypt('Password123!'),
        ]);
        $user->assignRole('customer');

        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $userCart = Cart::factory()->forUser($user)->create();
        CartItem::factory()->create([
            'cart_id' => $userCart->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price_cents' => 1999,
        ]);

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/auth/login', [
                'email' => 'jane@example.com',
                'password' => 'Password123!',
            ]);

        $response->assertOk();

        $mergedCart = Cart::where('user_id', $user->id)->first();
        $this->assertNotNull($mergedCart);

        $mergedItem = $mergedCart->items()->where('product_id', $this->product->id)->first();
        $this->assertNotNull($mergedItem);
        $this->assertEquals(3, $mergedItem->quantity);
    }

    public function test_stock_validation_on_quantity_update(): void
    {
        $this->withHeader('X-Cart-Session', $this->sessionId)
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ]);

        $cart = Cart::where('session_id', $this->sessionId)->first();
        $item = $cart->items()->first();

        $response = $this->withHeader('X-Cart-Session', $this->sessionId)
            ->patchJson("/api/v1/cart/items/{$item->id}", [
                'quantity' => 20,
            ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_add_item(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/cart/items', [
                'product_id' => $this->product->id,
                'quantity' => 3,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.cart.item_count', 3);
    }

    public function test_guest_can_access_cart_without_session(): void
    {
        $response = $this->getJson('/api/v1/cart');

        $response->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }

    public function test_cart_show_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $token = $user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;

        $cart = Cart::factory()->forUser($user)->create();
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price_cents' => 1999,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/cart');

        $response->assertOk()
            ->assertJsonPath('data.item_count', 2)
            ->assertJsonPath('data.total_cents', 3998);
    }
}
