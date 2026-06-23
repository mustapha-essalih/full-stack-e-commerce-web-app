<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    private const int CACHE_TTL_SECONDS = 900;

    private const array VALID_STATUSES = [
        'paid',
        'processing',
        'shipped',
        'delivered',
    ];

    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {
    }

    public function getRevenueSummary(Carbon $from, Carbon $to): array
    {
        $cacheKey = "analytics:revenue-summary:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::tags('analytics')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($from, $to): array {
            $periodLength = $from->diffInDays($to) + 1;
            $previousFrom = (clone $from)->subDays($periodLength);
            $previousTo = (clone $from)->subDay();

            $current = $this->aggregateRevenue($from, $to);
            $previous = $this->aggregateRevenue($previousFrom, $previousTo);

            $revenueCents = (int) ($current->revenue_cents ?? 0);
            $orderCount = (int) ($current->order_count ?? 0);
            $previousRevenueCents = (int) ($previous->revenue_cents ?? 0);
            $previousOrderCount = (int) ($previous->order_count ?? 0);

            $avgOrderValue = $orderCount > 0 ? (int) round($revenueCents / $orderCount) : 0;
            $previousAvgOrderValue = $previousOrderCount > 0 ? (int) round($previousRevenueCents / $previousOrderCount) : 0;

            return [
                'revenue_cents' => $revenueCents,
                'order_count' => $orderCount,
                'average_order_value_cents' => $avgOrderValue,
                'comparison' => [
                    'revenue_change_cents' => $revenueCents - $previousRevenueCents,
                    'revenue_change_percent' => $previousRevenueCents > 0
                        ? round(($revenueCents - $previousRevenueCents) / $previousRevenueCents * 100, 1)
                        : 0.0,
                    'order_count_change' => $orderCount - $previousOrderCount,
                    'order_count_change_percent' => $previousOrderCount > 0
                        ? round(($orderCount - $previousOrderCount) / $previousOrderCount * 100, 1)
                        : 0.0,
                    'aov_change_cents' => $avgOrderValue - $previousAvgOrderValue,
                    'aov_change_percent' => $previousAvgOrderValue > 0
                        ? round(($avgOrderValue - $previousAvgOrderValue) / $previousAvgOrderValue * 100, 1)
                        : 0.0,
                ],
            ];
        });
    }

    public function getDailyRevenue(Carbon $from, Carbon $to): array
    {
        $cacheKey = "analytics:daily-revenue:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::tags('analytics')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($from, $to): array {
            $driver = DB::connection()->getDriverName();
            $dateCol = $driver === 'sqlite' ? "DATE(created_at)" : "date_trunc('day', created_at)";

            $rows = Order::whereIn('status', self::VALID_STATUSES)
                ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
                ->groupBy(DB::raw($dateCol))
                ->orderBy(DB::raw($dateCol))
                ->get([
                    DB::raw("{$dateCol} as date"),
                    DB::raw('SUM(total_cents) as revenue_cents'),
                    DB::raw('COUNT(*) as order_count'),
                ]);

            return $rows->map(fn (Order $row): array => [
                'date' => Carbon::parse($row->date)->toDateString(),
                'revenue_cents' => (int) $row->revenue_cents,
                'order_count' => (int) $row->order_count,
            ])->toArray();
        });
    }

    public function getTopProducts(Carbon $from, Carbon $to, int $limit = 10): array
    {
        $cacheKey = "analytics:top-products:{$from->toDateString()}:{$to->toDateString()}:{$limit}";

        return Cache::tags('analytics')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($from, $to, $limit): array {
            $orderIds = Order::whereIn('status', self::VALID_STATUSES)
                ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
                ->pluck('id');

            if ($orderIds->isEmpty()) {
                return [];
            }

            $rows = OrderItem::whereIn('order_id', $orderIds)
                ->whereNotNull('product_id')
                ->groupBy('product_id', 'product_name', 'product_sku')
                ->orderByDesc(DB::raw('SUM(total_cents)'))
                ->take($limit)
                ->get([
                    'product_id',
                    'product_name',
                    'product_sku',
                    DB::raw('SUM(quantity) as units_sold'),
                    DB::raw('SUM(total_cents) as revenue_cents'),
                ]);

            return $rows->map(fn (OrderItem $row): array => [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'product_sku' => $row->product_sku,
                'units_sold' => (int) $row->units_sold,
                'revenue_cents' => (int) $row->revenue_cents,
            ])->values()->toArray();
        });
    }

    public function getTopCategories(Carbon $from, Carbon $to): array
    {
        $cacheKey = "analytics:top-categories:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::tags('analytics')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($from, $to): array {
            $rows = OrderItem::whereIn('order_id', function ($q) use ($from, $to): void {
                $q->select('id')
                    ->from('orders')
                    ->whereIn('status', self::VALID_STATUSES)
                    ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()]);
            })
                ->whereNotNull('product_id')
                ->join('category_product', 'order_items.product_id', '=', 'category_product.product_id')
                ->join('categories', 'category_product.category_id', '=', 'categories.id')
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc(DB::raw('SUM(order_items.total_cents)'))
                ->get([
                    'categories.id',
                    'categories.name',
                    DB::raw('SUM(order_items.total_cents) as revenue_cents'),
                    DB::raw('SUM(order_items.quantity) as units_sold'),
                ]);

            return $rows->map(fn (object $row): array => [
                'category_id' => (int) $row->id,
                'category_name' => $row->name,
                'revenue_cents' => (int) $row->revenue_cents,
                'units_sold' => (int) $row->units_sold,
            ])->toArray();
        });
    }

    public function getNewVsReturningCustomers(Carbon $from, Carbon $to): array
    {
        $cacheKey = "analytics:customers:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::tags('analytics')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($from, $to): array {
            $orderUserIds = Order::whereIn('status', self::VALID_STATUSES)
                ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
                ->whereNotNull('user_id')
                ->pluck('user_id')
                ->unique()
                ->values();

            if ($orderUserIds->isEmpty()) {
                return [
                    'new_count' => 0,
                    'returning_count' => 0,
                ];
            }

            $firstOrderDates = Order::whereIn('user_id', $orderUserIds)
                ->whereIn('status', self::VALID_STATUSES)
                ->groupBy('user_id')
                ->select('user_id', DB::raw('MIN(created_at) as first_order_date'))
                ->get()
                ->keyBy('user_id');

            $newCount = 0;
            $returningCount = 0;

            foreach ($orderUserIds as $userId) {
                $firstOrder = $firstOrderDates->get($userId);
                if (!$firstOrder) {
                    continue;
                }

                $firstOrderDate = Carbon::parse($firstOrder->first_order_date);

                if ($firstOrderDate->between($from->startOfDay(), $to->endOfDay())) {
                    $newCount++;
                } else {
                    $returningCount++;
                }
            }

            return [
                'new_count' => $newCount,
                'returning_count' => $returningCount,
            ];
        });
    }

    public function getLowStockSummary(): array
    {
        return Cache::tags('analytics')->remember('analytics:low-stock', self::CACHE_TTL_SECONDS, function (): array {
            $products = $this->inventoryService->getLowStockProducts();

            return [
                'count' => $products->count(),
                'products' => $products->map(fn (Product $p): array => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'stock_quantity' => $p->stock_quantity,
                ])->toArray(),
            ];
        });
    }

    public function getCouponUsageSummary(Carbon $from, Carbon $to): array
    {
        $cacheKey = "analytics:coupons:{$from->toDateString()}:{$to->toDateString()}";

        return Cache::tags('analytics')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($from, $to): array {
            $summary = CouponUsage::whereHas('order', function ($q) use ($from, $to): void {
                $q->whereIn('status', self::VALID_STATUSES)
                    ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()]);
            })
                ->select(
                    DB::raw('COUNT(DISTINCT coupon_id) as unique_coupons_used'),
                    DB::raw('COUNT(*) as total_usages'),
                    DB::raw('SUM(discount_cents) as total_discount_cents'),
                )
                ->first();

            $usages = CouponUsage::whereHas('order', function ($q) use ($from, $to): void {
                $q->whereIn('status', self::VALID_STATUSES)
                    ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()]);
            })
                ->with('coupon')
                ->get()
                ->groupBy('coupon_id')
                ->map(fn (Collection $items): array => [
                    'coupon_code' => $items->first()->coupon?->code ?? 'unknown',
                    'times_used' => $items->count(),
                    'total_discount_cents' => $items->sum('discount_cents'),
                ])
                ->values()
                ->toArray();

            return [
                'unique_coupons_used' => (int) ($summary?->unique_coupons_used ?? 0),
                'total_usages' => (int) ($summary?->total_usages ?? 0),
                'total_discount_cents' => (int) ($summary?->total_discount_cents ?? 0),
                'coupons' => $usages,
            ];
        });
    }

    private function aggregateRevenue(Carbon $from, Carbon $to): ?object
    {
        return Order::whereIn('status', self::VALID_STATUSES)
            ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
            ->select(
                DB::raw('COALESCE(SUM(total_cents), 0) as revenue_cents'),
                DB::raw('COUNT(*) as order_count'),
            )
            ->first();
    }
}
