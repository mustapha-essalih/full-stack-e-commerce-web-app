<?php

declare(strict_types=1);

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCollectionResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Repositories\ProductRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepository $productRepository,
    ) {}

    public function index(Request $request): ProductCollectionResource
    {
        $filters = $request->only([
            'search',
            'category_id',
            'category_slug',
            'min_price',
            'max_price',
            'in_stock',
            'sort',
            'direction',
            'per_page',
            'page',
        ]);

        $products = $this->productRepository->searchAndFilter($filters);

        return new ProductCollectionResource($products);
    }

    public function featured(): JsonResponse
    {
        $products = $this->productRepository->getFeatured();

        return response()->json([
            'data' => ProductResource::collection($products),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = $this->productRepository->findBySlug($slug);

        if (!$product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        $related = $this->productRepository->getRelated($product);

        return response()->json([
            'data' => [
                'product' => new ProductResource($product),
                'related' => ProductResource::collection($related),
            ],
        ]);
    }
}
