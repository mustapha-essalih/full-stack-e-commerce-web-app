<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryAdjustmentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StockAdjustmentRequest;
use App\Http\Resources\InventoryAdjustmentCollectionResource;
use App\Http\Resources\InventoryAdjustmentResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    public function lowStock(): JsonResponse
    {
        $products = $this->inventoryService->getLowStockProducts();

        return response()->json([
            'data' => ProductResource::collection($products),
            'meta' => ['count' => $products->count()],
        ]);
    }

    public function adjust(StockAdjustmentRequest $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $type = InventoryAdjustmentType::from($request->input('type'));
        $quantity = (int) $request->input('quantity');
        $delta = $type === InventoryAdjustmentType::Restock ? $quantity : -$quantity;
        $note = $request->input('note', '');

        try {
            $this->inventoryService->adjustStock(
                $product,
                $delta,
                $type,
                $request->user(),
                $note,
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => new ProductResource($product->fresh()),
            'message' => 'Stock adjusted successfully.',
        ]);
    }

    public function history(int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $history = $this->inventoryService->getAdjustmentHistory($product);

        return response()->json(new InventoryAdjustmentCollectionResource($history));
    }
}
