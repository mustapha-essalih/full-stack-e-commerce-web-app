<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'stripe_payment_intent_id' => 'pi_' . fake()->uuid(),
            'amount_cents' => 0,
            'currency' => 'usd',
            'status' => PaymentStatus::Pending->value,
            'stripe_charge_id' => null,
            'metadata' => null,
        ];
    }

    public function succeeded(): static
    {
        return $this->state(fn (): array => [
            'status' => PaymentStatus::Succeeded->value,
            'stripe_charge_id' => 'ch_' . fake()->uuid(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (): array => [
            'status' => PaymentStatus::Failed->value,
        ]);
    }

    public function forOrder(Order $order): static
    {
        return $this->state(fn (): array => [
            'order_id' => $order->id,
        ]);
    }
}
