<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class OrderRepository
{
    public function findByUuid(string $uuid): ?Order
    {
        if (!Str::isUuid($uuid)) {
            return null;
        }

        /** @var Order|null $order */
        $order = Order::with(['items', 'payment'])->where('uuid', $uuid)->first();

        return $order;
    }

    /**
     * @return LengthAwarePaginator<Order>
     */
    public function findByUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<Order> $orders */
        $orders = Order::with(['items', 'payment'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $orders;
    }

    /**
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<Order>
     */
    public function getAllForAdmin(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::with(['items', 'payment', 'user'])
            ->orderByDesc('created_at');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                if (Str::isUuid($search)) {
                    $q->where('uuid', $search);
                } else {
                    $q->orWhereHas('user', function ($userQuery) use ($search): void {
                        $userQuery->where('email', 'like', "%{$search}%");
                    });
                }
            });
        }

        /** @var LengthAwarePaginator<Order> $orders */
        $orders = $query->paginate($perPage);

        return $orders;
    }

    public function getWithItems(string $uuid): ?Order
    {
        if (!Str::isUuid($uuid)) {
            return null;
        }

        /** @var Order|null $order */
        $order = Order::with(['items', 'payment', 'user', 'billingAddress', 'shippingAddress'])
            ->where('uuid', $uuid)
            ->first();

        return $order;
    }
}
