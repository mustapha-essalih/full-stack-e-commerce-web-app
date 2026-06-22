<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->optional()->paragraphs(3, true),
            'short_description' => fake()->optional()->sentence(),
            'price_cents' => fake()->numberBetween(999, 99999),
            'compare_price_cents' => fake()->optional(0.3)->numberBetween(1999, 149999),
            'sku' => strtoupper(Str::random(8)),
            'stock_quantity' => fake()->numberBetween(0, 100),
            'is_active' => true,
            'is_featured' => fake()->boolean(20),
            'weight_grams' => fake()->optional()->numberBetween(100, 5000),
            'meta_title' => fake()->optional()->words(5, true),
            'meta_description' => fake()->optional()->sentence(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }
}
