<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $admin;
    private Product $product;
    private string $customerToken;
    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->customer = User::factory()->create(['name' => 'John Doe']);
        $this->customer->assignRole('customer');

        $this->admin = User::factory()->create(['name' => 'Admin User']);
        $this->admin->assignRole('admin');

        $this->product = Product::factory()->create([
            'is_active' => true,
            'stock_quantity' => 10,
        ]);

        $this->customerToken = $this->customer->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
        $this->adminToken = $this->admin->createToken('access', ['*'], now()->addMinutes(15))->plainTextToken;
    }

    private function createDeliveredOrder(User $user, Product $product): Order
    {
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'delivered',
            'subtotal_cents' => $product->price_cents,
            'total_cents' => $product->price_cents,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'unit_price_cents' => $product->price_cents,
            'quantity' => 1,
            'total_cents' => $product->price_cents,
        ]);

        return $order;
    }

    // ─── Eligibility ────────────────────────────────────────────────────

    public function test_eligible_customer_can_submit_review(): void
    {
        $this->createDeliveredOrder($this->customer, $this->product);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'rating' => 5,
                'title' => 'Great product!',
                'body' => 'Really loved this product.',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.title', 'Great product!')
            ->assertJsonPath('data.is_approved', false);

        $this->assertDatabaseHas('reviews', [
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
        ]);
    }

    public function test_customer_without_purchase_cannot_review(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'rating' => 5,
                'title' => 'Great!',
                'body' => 'Love it.',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You are not eligible to review this product.');
    }

    public function test_customer_with_non_delivered_order_cannot_review(): void
    {
        Order::factory()->create([
            'user_id' => $this->customer->id,
            'status' => 'paid',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'rating' => 5,
                'title' => 'Great!',
                'body' => 'Love it.',
            ]);

        $response->assertStatus(403);
    }

    public function test_customer_cannot_review_same_product_twice(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'rating' => 4,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'rating' => 5,
                'title' => 'Still great!',
                'body' => 'Second review.',
            ]);

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_submit_review(): void
    {
        $response = $this->postJson("/api/v1/products/{$this->product->slug}/reviews", [
            'rating' => 5,
        ]);

        $response->assertUnauthorized();
    }

    public function test_submitted_review_not_visible_until_approved(): void
    {
        $this->createDeliveredOrder($this->customer, $this->product);

        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'rating' => 5,
                'title' => 'Great!',
                'body' => 'Love it.',
            ]);

        $response = $this->getJson("/api/v1/products/{$this->product->slug}/reviews");

        $response->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    // ─── Public Review Listing ──────────────────────────────────────────

    public function test_public_can_view_approved_reviews_with_aggregate(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->approved()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'rating' => 5,
        ]);

        $otherUser = User::factory()->create();
        $otherOrder = $this->createDeliveredOrder($otherUser, $this->product);

        Review::factory()->approved()->create([
            'product_id' => $this->product->id,
            'user_id' => $otherUser->id,
            'order_id' => $otherOrder->id,
            'rating' => 3,
        ]);

        // Unapproved should not show
        Review::factory()->create([
            'product_id' => $this->product->id,
            'order_id' => $order->id,
            'rating' => 1,
        ]);

        $response = $this->getJson("/api/v1/products/{$this->product->slug}/reviews");

        $response->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.average_rating', 4.0)
            ->assertJsonPath('meta.review_count', 2)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'rating', 'reviewer_name', 'title', 'body', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total', 'average_rating', 'review_count'],
            ]);
    }

    public function test_review_shows_first_name_and_last_initial(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->approved()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'rating' => 5,
        ]);

        $response = $this->getJson("/api/v1/products/{$this->product->slug}/reviews");

        $response->assertOk()
            ->assertJsonPath('data.0.reviewer_name', 'John D.');
    }

    public function test_review_list_is_paginated(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->approved()->count(3)->create([
            'product_id' => $this->product->id,
            'order_id' => $order->id,
        ]);

        $response = $this->getJson("/api/v1/products/{$this->product->slug}/reviews?per_page=2");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    // ─── Aggregate Rating on Product Detail ─────────────────────────────

    public function test_product_detail_includes_average_rating(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->approved()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'rating' => 4,
        ]);

        $response = $this->getJson("/api/v1/products/{$this->product->slug}");

        $response->assertOk()
            ->assertJsonPath('data.product.average_rating', 4.0)
            ->assertJsonPath('data.product.review_count', 1);
    }

    // ─── Customer's Own Reviews ─────────────────────────────────────────

    public function test_customer_can_view_their_reviews(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->approved()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'rating' => 5,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/v1/account/reviews');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rating', 5)
            ->assertJsonPath('data.0.is_approved', true);
    }

    public function test_customer_sees_only_own_reviews(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
        ]);

        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $otherOrder = $this->createDeliveredOrder($otherUser, $this->product);

        Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $otherUser->id,
            'order_id' => $otherOrder->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/v1/account/reviews');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ─── Admin Moderation ───────────────────────────────────────────────

    public function test_admin_can_list_all_reviews(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);
        Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/v1/admin/reviews');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_reviews_by_status(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'is_approved' => false,
        ]);

        Review::factory()->approved()->create([
            'product_id' => $this->product->id,
            'order_id' => $order->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/v1/admin/reviews?filter[status]=approved');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_approved', true);
    }

    public function test_admin_can_approve_review(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        $review = Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'is_approved' => false,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->patchJson("/api/v1/admin/reviews/{$review->id}/approve");

        $response->assertOk()
            ->assertJsonPath('message', 'Review approved.')
            ->assertJsonPath('data.is_approved', true);

        $this->assertNotNull($review->fresh()->approved_at);
    }

    public function test_admin_can_reject_review(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        $review = Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->patchJson("/api/v1/admin/reviews/{$review->id}/reject");

        $response->assertOk()
            ->assertJsonPath('message', 'Review rejected.')
            ->assertJsonPath('data.is_approved', false);

        $this->assertNull($review->fresh()->approved_at);
    }

    public function test_admin_can_flag_review(): void
    {
        $order = $this->createDeliveredOrder($this->customer, $this->product);

        $review = Review::factory()->create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'is_flagged' => false,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->patchJson("/api/v1/admin/reviews/{$review->id}/flag");

        $response->assertOk()
            ->assertJsonPath('message', 'Review flagged.')
            ->assertJsonPath('data.is_flagged', true);
    }

    public function test_non_admin_cannot_access_admin_reviews(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/v1/admin/reviews');

        $response->assertStatus(403);
    }

    // ─── Validation ─────────────────────────────────────────────────────

    public function test_review_rating_is_required(): void
    {
        $this->createDeliveredOrder($this->customer, $this->product);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'title' => 'No rating',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_review_rating_must_be_between_1_and_5(): void
    {
        $this->createDeliveredOrder($this->customer, $this->product);

        $response = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->slug}/reviews", [
                'rating' => 6,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }
}
