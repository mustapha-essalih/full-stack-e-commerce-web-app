<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Address>
 */
class AddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => null,
            'label' => fake()->randomElement(['Home', 'Work', 'Shipping']),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'line1' => fake()->streetAddress(),
            'line2' => fake()->secondaryAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country_code' => 'US',
            'is_default' => false,
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(fn (): array => [
            'user_id' => $user->id,
        ]);
    }
}
