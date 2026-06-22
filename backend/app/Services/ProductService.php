<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;

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
        $data = $this->sanitizeDescription($data);

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
        $data = $this->sanitizeDescription($data);
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

    /**
     * @param array<int> $ids
     */
    public function bulkActivate(array $ids): void
    {
        Product::withTrashed()->whereIn('id', $ids)->update([
            'is_active' => true,
            'deleted_at' => null,
        ]);
    }

    /**
     * @param array<int> $ids
     */
    public function bulkArchive(array $ids): void
    {
        DB::transaction(function () use ($ids): void {
            $products = Product::whereIn('id', $ids)->get();

            foreach ($products as $product) {
                if ($product->trashed()) {
                    continue;
                }
                $product->delete();
            }
        });
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function sanitizeDescription(array $data): array
    {
        if (isset($data['description'])) {
            $data['description'] = strip_tags($data['description'], '<p><br><strong><em><u><h1><h2><h3><h4><h5><h6><ul><ol><li><blockquote><pre><code><span><div><a><img><hr>');
        }

        return $data;
    }

    public function setPrimaryImage(Product $product, int $imageId): void
    {
        $product->images()->update(['is_primary' => false]);
        ProductImage::where('id', $imageId)
            ->where('product_id', $product->id)
            ->update(['is_primary' => true]);
    }
}
