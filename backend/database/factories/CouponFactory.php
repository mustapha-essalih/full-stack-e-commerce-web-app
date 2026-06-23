<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['percentage', 'fixed_amount']);

        return [
            'code' => strtoupper(fake()->unique()->bothify('???' . '###')),
            'description' => fake()->sentence(),
            'type' => $type,
            'value' => $type === 'percentage' ? fake()->numberBetween(5, 50) : fake()->numberBetween(500, 5000),
            'minimum_order_cents' => null,
            'usage_limit' => null,
            'usage_count' => 0,
            'per_customer_limit' => null,
            'starts_at' => null,
            'expires_at' => fake()->boolean(70) ? fake()->dateTimeBetween('+1 day', '+6 months') : null,
            'is_active' => true,
        ];
    }

    public function percentage(): static
    {
        return $this->state(fn (): array => [
            'type' => 'percentage',
            'value' => fake()->numberBetween(5, 50),
        ]);
    }

    public function fixedAmount(): static
    {
        return $this->state(fn (): array => [
            'type' => 'fixed_amount',
            'value' => fake()->numberBetween(500, 5000),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }

    public function usageLimited(int $limit): static
    {
        return $this->state(fn (): array => [
            'usage_limit' => $limit,
            'usage_count' => $limit,
        ]);
    }
}
