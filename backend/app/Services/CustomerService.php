<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Enums\OrderStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerService
{
    /**
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<User>
     */
    public function getAllCustomers(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()
            ->select('users.*')
            ->withCount(['orders as orders_count' => function ($q): void {
                $q->where('status', '!=', OrderStatus::Cancelled->value);
            }])
            ->withSum(['orders as total_spent_cents' => function ($q): void {
                $q->whereIn('status', [
                    OrderStatus::Paid->value,
                    OrderStatus::Processing->value,
                    OrderStatus::Shipped->value,
                    OrderStatus::Delivered->value,
                    OrderStatus::Refunded->value,
                ]);
            }], 'total_cents')
            ->orderByDesc('created_at');

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['has_orders'])) {
            if ($filters['has_orders'] === 'true' || $filters['has_orders'] === '1') {
                $query->has('orders');
            } elseif ($filters['has_orders'] === 'false' || $filters['has_orders'] === '0') {
                $query->doesntHave('orders');
            }
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        /** @var LengthAwarePaginator<User> */
        return $query->paginate($perPage);
    }

    /**
     * @return array<string, mixed>
     */
    public function getCustomerDetail(User $user): array
    {
        $user->loadCount(['orders as orders_count' => function ($q): void {
            $q->where('status', '!=', OrderStatus::Cancelled->value);
        }]);

        $totalSpentCents = (int) $user->orders()
            ->whereIn('status', [
                OrderStatus::Paid->value,
                OrderStatus::Processing->value,
                OrderStatus::Shipped->value,
                OrderStatus::Delivered->value,
                OrderStatus::Refunded->value,
            ])
            ->sum('total_cents');

        $recentOrders = $user->orders()
            ->with(['items', 'payment'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return [
            'user' => $user,
            'orders_count' => (int) $user->orders_count,
            'total_spent_cents' => $totalSpentCents,
            'total_spent_formatted' => '$' . number_format($totalSpentCents / 100, 2),
            'recent_orders' => $recentOrders,
        ];
    }

    public function suspendCustomer(User $user): User
    {
        $user->is_suspended = true;
        $user->suspended_at = now();
        $user->save();

        $user->tokens()->delete();

        return $user->fresh();
    }

    public function reinstateCustomer(User $user): User
    {
        $user->is_suspended = false;
        $user->suspended_at = null;
        $user->save();

        return $user->fresh();
    }
}
