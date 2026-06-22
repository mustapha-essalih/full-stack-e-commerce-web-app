<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AddressService
{
    public function getForUser(User $user): Collection
    {
        return $user->addresses()->orderBy('is_default', 'desc')->orderBy('created_at', 'desc')->get();
    }

    public function create(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data): Address {
            if (!empty($data['is_default'])) {
                $user->addresses()->update(['is_default' => false]);
            }

            /** @var Address $address */
            $address = $user->addresses()->create($data);

            return $address;
        });
    }

    public function update(Address $address, array $data): Address
    {
        return DB::transaction(function () use ($address, $data): Address {
            if (!empty($data['is_default'])) {
                $address->user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($data);

            return $address->fresh();
        });
    }

    public function setDefault(Address $address): Address
    {
        return DB::transaction(function () use ($address): Address {
            $address->user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);

            return $address->fresh();
        });
    }

    public function delete(Address $address): void
    {
        $inProgressOrders = $address->ordersAsBilling()->whereNotIn('status', [
            OrderStatus::Delivered->value,
            OrderStatus::Cancelled->value,
        ])->exists();

        if ($inProgressOrders) {
            abort(409, 'Cannot delete address. It is referenced by an in-progress order.');
        }

        $inProgressShippingOrders = $address->ordersAsShipping()->whereNotIn('status', [
            OrderStatus::Delivered->value,
            OrderStatus::Cancelled->value,
        ])->exists();

        if ($inProgressShippingOrders) {
            abort(409, 'Cannot delete address. It is referenced by an in-progress order.');
        }

        $address->delete();
    }
}
