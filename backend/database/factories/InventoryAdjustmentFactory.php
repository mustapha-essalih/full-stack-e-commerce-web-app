<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\InventoryAdjustmentType;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InventoryAdjustment>
 */
class InventoryAdjustmentFactory extends Factory
{
    protected $model = \App\Models\InventoryAdjustment::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'user_id' => User::factory(),
            'type' => InventoryAdjustmentType::Adjustment->value,
            'quantity_change' => $this->faker->numberBetween(-10, 50),
            'quantity_after' => $this->faker->numberBetween(0, 100),
            'note' => $this->faker->sentence(),
        ];
    }
}
