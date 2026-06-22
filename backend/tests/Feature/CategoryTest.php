<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Database\Factories\CategoryFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CategoryTest extends TestCase
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

    public function test_public_can_list_active_categories(): void
    {
        $parent = Category::factory()->create(['is_active' => true]);
        $child = Category::factory()->childOf($parent)->create(['is_active' => true]);
        Category::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/categories');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.uuid', $parent->uuid);
    }

    public function test_public_can_show_category_by_slug(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        $response = $this->getJson("/api/v1/categories/{$category->slug}");

        $response->assertOk()
            ->assertJsonPath('data.category.uuid', $category->uuid);
    }

    public function test_public_returns_404_for_inactive_category(): void
    {
        $category = Category::factory()->inactive()->create();

        $response = $this->getJson("/api/v1/categories/{$category->slug}");

        $response->assertNotFound();
    }

    public function test_admin_can_create_category(): void
    {
        $data = [
            'name' => 'New Category',
            'description' => 'Category description',
            'is_active' => true,
            'sort_order' => 1,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/categories', $data);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'New Category');

        $this->assertDatabaseHas('categories', ['name' => 'New Category']);
    }

    public function test_admin_can_update_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/categories/{$category->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_admin_can_delete_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertOk();
        $this->assertSoftDeleted('categories', ['id' => $category->id]);
    }
}
