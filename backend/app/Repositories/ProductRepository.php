<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository
{
    public function findBySlug(string $slug): ?Product
    {
        return Product::with(['categories', 'images', 'categories.children'])
            ->active()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * @param array{
     *     search?: string,
     *     category_id?: int,
     *     category_slug?: string,
     *     min_price?: int,
     *     max_price?: int,
     *     in_stock?: bool,
     *     include_inactive?: bool,
     *     sort?: string,
     *     direction?: string,
     *     per_page?: int,
     * } $filters
     */
    public function searchAndFilter(array $filters = []): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 15), 100);

        /** @var Builder<Product> $query */
        $query = Product::with(['images', 'categories']);

        if (empty($filters['include_inactive'])) {
            $query->active();
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%")
                    ->orWhere('short_description', 'ilike', "%{$search}%");
            });
        }

        if (!empty($filters['category_id'])) {
            $query->whereHas('categories', fn (Builder $q) => $q->where('id', (int) $filters['category_id']));
        }

        if (!empty($filters['category_slug'])) {
            $query->whereHas('categories', fn (Builder $q) => $q->where('slug', $filters['category_slug']));
        }

        if (isset($filters['min_price'])) {
            $query->where('price_cents', '>=', (int) $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('price_cents', '<=', (int) $filters['max_price']);
        }

        if (!empty($filters['in_stock'])) {
            $query->where('stock_quantity', '>', 0);
        }

        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';

        $allowedSorts = ['name', 'price_cents', 'created_at', 'stock_quantity'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        $direction = strtolower($direction) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sort, $direction);

        return $query->paginate($perPage);
    }

    /**
     * @param array<int> $ids
     * @return \Illuminate\Database\Eloquent\Collection<int, Product>
     */
    public function findByIds(array $ids): Collection
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Product> $products */
        $products = Product::withTrashed()
            ->with(['images', 'categories'])
            ->whereIn('id', $ids)
            ->get();

        return $products;
    }

    public function getFeatured(int $limit = 8): Collection
    {
        return Product::with(['primaryImage', 'categories'])
            ->active()
            ->featured()
            ->inStock()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getRelated(Product $product, int $limit = 4): Collection
    {
        $categoryIds = $product->categories->pluck('id')->toArray();

        if (empty($categoryIds)) {
            return Collection::empty();
        }

        return Product::with(['primaryImage', 'categories'])
            ->active()
            ->where('id', '!=', $product->id)
            ->whereHas('categories', fn (Builder $q) => $q->whereIn('id', $categoryIds))
            ->inRandomOrder()
            ->limit($limit)
            ->get();
    }
}
