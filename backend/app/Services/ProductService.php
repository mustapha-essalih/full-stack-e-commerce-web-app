<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;

class ProductService
{
    public function __construct(
        private readonly ImageUploadService $imageUploadService,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public function createProduct(array $data): Product
    {
        /** @var Product $product */
        $product = Product::create($data);

        if (!empty($data['category_ids'])) {
            $product->categories()->sync($data['category_ids']);
        }

        return $product->load(['categories', 'images']);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateProduct(Product $product, array $data): Product
    {
        $product->update($data);

        if (array_key_exists('category_ids', $data)) {
            $product->categories()->sync($data['category_ids'] ?? []);
        }

        return $product->fresh()->load(['categories', 'images']);
    }

    public function archiveProduct(Product $product): void
    {
        $product->delete();
    }

    public function restoreProduct(Product $product): void
    {
        $product->restore();
    }

    /**
     * @param array<int, array{id: int, sort_order: int}> $orderedImages
     */
    public function reorderImages(Product $product, array $orderedImages): void
    {
        foreach ($orderedImages as $item) {
            ProductImage::where('id', $item['id'])
                ->where('product_id', $product->id)
                ->update(['sort_order' => $item['sort_order']]);
        }
    }

    public function setPrimaryImage(Product $product, int $imageId): void
    {
        $product->images()->update(['is_primary' => false]);
        ProductImage::where('id', $imageId)
            ->where('product_id', $product->id)
            ->update(['is_primary' => true]);
    }
}
