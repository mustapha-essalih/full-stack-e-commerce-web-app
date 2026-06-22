<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'user_id' => null,
            'status' => OrderStatus::Pending->value,
            'subtotal_cents' => 0,
            'tax_cents' => 0,
            'shipping_cents' => 0,
            'discount_cents' => 0,
            'total_cents' => 0,
            'currency' => 'usd',
            'notes' => null,
            'coupon_code' => null,
            'billing_address_id' => null,
            'shipping_address_id' => null,
            'paid_at' => null,
            'cancelled_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::Pending->value,
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::Paid->value,
            'paid_at' => now(),
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::Processing->value,
            'paid_at' => now(),
            'processing_at' => now(),
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::Shipped->value,
            'paid_at' => now(),
            'processing_at' => now(),
            'shipped_at' => now(),
            'tracking_number' => '1Z' . fake()->regexify('[0-9]{16}'),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::Delivered->value,
            'paid_at' => now(),
            'processing_at' => now(),
            'shipped_at' => now()->subDays(2),
            'delivered_at' => now(),
            'tracking_number' => '1Z' . fake()->regexify('[0-9]{16}'),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::Cancelled->value,
            'cancelled_at' => now(),
        ]);
    }

    public function forUser(User $user): static
    {
        return $this->state(fn (): array => [
            'user_id' => $user->id,
        ]);
    }

    public function withAddress(Address $address): static
    {
        return $this->state(fn (): array => [
            'billing_address_id' => $address->id,
            'shipping_address_id' => $address->id,
        ]);
    }
}
