<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('CurrentPass1!'),
        ]);
        $this->user->assignRole('customer');
        $this->token = $this->user->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    // ─── Profile ───────────────────────────────────────────────────────────────

    public function test_can_get_profile(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/account/profile');

        $response->assertOk()
            ->assertJsonPath('data.email', 'john@example.com')
            ->assertJsonStructure([
                'data' => ['uuid', 'name', 'email', 'roles', 'email_verified_at', 'created_at'],
            ]);
    }

    public function test_profile_requires_auth(): void
    {
        $this->getJson('/api/v1/account/profile')->assertUnauthorized();
    }

    public function test_can_update_profile_name(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->patchJson('/api/v1/account/profile', [
                'name' => 'Jane Doe',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Jane Doe');
    }

    public function test_updating_email_resets_verification(): void
    {
        $this->user->update(['email_verified_at' => now()]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->patchJson('/api/v1/account/profile', [
                'email' => 'jane@example.com',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.email', 'jane@example.com');

        $this->assertNull($this->user->fresh()->email_verified_at);
    }

    public function test_can_update_password(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->patchJson('/api/v1/account/password', [
                'current_password' => 'CurrentPass1!',
                'new_password' => 'NewPass123!',
                'new_password_confirmation' => 'NewPass123!',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Password updated successfully.');

        $this->assertTrue(Hash::check('NewPass123!', $this->user->fresh()->password));
    }

    public function test_update_password_requires_correct_current(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->patchJson('/api/v1/account/password', [
                'current_password' => 'WrongPass1!',
                'new_password' => 'NewPass123!',
                'new_password_confirmation' => 'NewPass123!',
            ]);

        $response->assertStatus(422);
    }

    public function test_password_requires_auth(): void
    {
        $this->patchJson('/api/v1/account/password', [
            'current_password' => 'CurrentPass1!',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ])->assertUnauthorized();
    }

    public function test_profile_update_requires_auth(): void
    {
        $this->patchJson('/api/v1/account/profile', ['name' => 'Test'])->assertUnauthorized();
    }

    // ─── Addresses ─────────────────────────────────────────────────────────────

    public function test_can_list_addresses(): void
    {
        Address::factory()->forUser($this->user)->create(['is_default' => true]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/account/addresses');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_can_create_address(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/account/addresses', [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'line1' => '123 Main St',
                'city' => 'New York',
                'country_code' => 'US',
                'is_default' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.first_name', 'John');

        $this->assertDatabaseHas('addresses', [
            'user_id' => $this->user->id,
            'is_default' => true,
        ]);
    }

    public function test_only_one_default_address_per_user(): void
    {
        Address::factory()->forUser($this->user)->create(['is_default' => true]);

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/account/addresses', [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'line1' => '456 Oak Ave',
                'city' => 'Los Angeles',
                'country_code' => 'US',
                'is_default' => true,
            ]);

        $defaults = Address::where('user_id', $this->user->id)->where('is_default', true)->count();
        $this->assertEquals(1, $defaults);
    }

    public function test_can_update_address(): void
    {
        $address = Address::factory()->forUser($this->user)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/account/addresses/{$address->id}", [
                'first_name' => 'Jane',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.first_name', 'Jane');
    }

    public function test_cannot_update_others_address(): void
    {
        $otherUser = User::factory()->create();
        $address = Address::factory()->forUser($otherUser)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/account/addresses/{$address->id}", [
                'first_name' => 'Jane',
            ]);

        $response->assertNotFound();
    }

    public function test_can_set_default_address(): void
    {
        $address1 = Address::factory()->forUser($this->user)->create(['is_default' => true]);
        $address2 = Address::factory()->forUser($this->user)->create(['is_default' => false]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->patchJson("/api/v1/account/addresses/{$address2->id}/default");

        $response->assertOk();

        $this->assertFalse($address1->fresh()->is_default);
        $this->assertTrue($address2->fresh()->is_default);
    }

    public function test_can_delete_address(): void
    {
        $address = Address::factory()->forUser($this->user)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/account/addresses/{$address->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    public function test_cannot_delete_address_referenced_by_in_progress_order(): void
    {
        $address = Address::factory()->forUser($this->user)->create();

        Order::factory()->create([
            'user_id' => $this->user->id,
            'billing_address_id' => $address->id,
            'status' => OrderStatus::Paid->value,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/account/addresses/{$address->id}");

        $response->assertStatus(409);
    }

    public function test_can_delete_address_referenced_by_delivered_order(): void
    {
        $address = Address::factory()->forUser($this->user)->create();

        Order::factory()->create([
            'user_id' => $this->user->id,
            'billing_address_id' => $address->id,
            'status' => OrderStatus::Delivered->value,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/account/addresses/{$address->id}");

        $response->assertOk();
    }

    public function test_cannot_delete_others_address(): void
    {
        $otherUser = User::factory()->create();
        $address = Address::factory()->forUser($otherUser)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/account/addresses/{$address->id}");

        $response->assertNotFound();
    }

    public function test_addresses_require_auth(): void
    {
        $this->getJson('/api/v1/account/addresses')->assertUnauthorized();
        $this->postJson('/api/v1/account/addresses', [])->assertUnauthorized();
    }

    // ─── Wishlist ──────────────────────────────────────────────────────────────

    public function test_can_get_wishlist(): void
    {
        $product = Product::factory()->create();
        $this->user->wishlist()->create(['product_id' => $product->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/account/wishlist');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'product', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 1);
    }

    public function test_can_add_to_wishlist(): void
    {
        $product = Product::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/account/wishlist', [
                'product_id' => $product->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.product.uuid', $product->uuid);

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $this->user->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_cannot_duplicate_wishlist_entry(): void
    {
        $product = Product::factory()->create();
        $this->user->wishlist()->create(['product_id' => $product->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/account/wishlist', [
                'product_id' => $product->id,
            ]);

        // firstOrCreate should return existing without creating duplicate
        $response->assertCreated();
        $this->assertDatabaseCount('wishlists', 1);
    }

    public function test_can_remove_from_wishlist(): void
    {
        $product = Product::factory()->create();
        $this->user->wishlist()->create(['product_id' => $product->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson('/api/v1/account/wishlist', [
                'product_id' => $product->id,
            ]);

        $response->assertOk();

        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $this->user->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_wishlist_requires_auth(): void
    {
        $this->getJson('/api/v1/account/wishlist')->assertUnauthorized();
        $this->postJson('/api/v1/account/wishlist', ['product_id' => 1])->assertUnauthorized();
        $this->deleteJson('/api/v1/account/wishlist', ['product_id' => 1])->assertUnauthorized();
    }
}
