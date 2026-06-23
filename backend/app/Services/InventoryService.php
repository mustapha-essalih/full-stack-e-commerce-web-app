<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InventoryAdjustmentType;
use App\Events\LowStockDetected;
use App\Exceptions\InsufficientStockException;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    private const int DEFAULT_LOW_STOCK_THRESHOLD = 10;

    public function adjustStock(
        Product $product,
        int $delta,
        InventoryAdjustmentType $type,
        ?User $user = null,
        string $note = '',
    ): void {
        DB::transaction(function () use ($product, $delta, $type, $user, $note): void {
            $lockedProduct = Product::lockForUpdate()->findOrFail($product->id);

            $newQuantity = $lockedProduct->stock_quantity + $delta;

            if ($newQuantity < 0) {
                throw new InsufficientStockException(
                    "Insufficient stock for {$lockedProduct->name}. Available: {$lockedProduct->stock_quantity}, attempted change: {$delta}."
                );
            }

            $lockedProduct->update(['stock_quantity' => $newQuantity]);

            InventoryAdjustment::create([
                'product_id' => $lockedProduct->id,
                'user_id' => $user?->id,
                'type' => $type->value,
                'quantity_change' => $delta,
                'quantity_after' => $newQuantity,
                'note' => $note,
            ]);

            if ($newQuantity < self::DEFAULT_LOW_STOCK_THRESHOLD) {
                LowStockDetected::dispatch($lockedProduct, $newQuantity);
            }
        });
    }

    public function reserveStock(Product $product, int $quantity): void
    {
        $this->adjustStock(
            $product,
            -$quantity,
            InventoryAdjustmentType::Sale,
        );
    }

    /**
     * @return Collection<int, Product>
     */
    public function getLowStockProducts(int $threshold = self::DEFAULT_LOW_STOCK_THRESHOLD): Collection
    {
        return Product::where('stock_quantity', '<', $threshold)
            ->whereNull('deleted_at')
            ->orderBy('stock_quantity')
            ->get();
    }

    public function getLowStockCount(int $threshold = self::DEFAULT_LOW_STOCK_THRESHOLD): int
    {
        return Product::where('stock_quantity', '<', $threshold)
            ->whereNull('deleted_at')
            ->count();
    }

    public function getAdjustmentHistory(Product $product, int $perPage = 15): LengthAwarePaginator
    {
        return InventoryAdjustment::where('product_id', $product->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
}
