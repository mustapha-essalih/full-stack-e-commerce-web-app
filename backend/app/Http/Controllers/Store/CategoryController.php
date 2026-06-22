<?php

declare(strict_types=1);

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryRepository $categoryRepository,
        private readonly ProductRepository $productRepository,
    ) {}

    public function index(): JsonResponse
    {
        $categories = $this->categoryRepository->getActiveRootCategories();

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $category = $this->categoryRepository->findBySlug($slug);

        if (!$category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }

        $products = $this->productRepository->searchAndFilter(
            array_merge($request->query(), ['category_id' => $category->id])
        );

        return response()->json([
            'data' => [
                'category' => new CategoryResource($category->load('children')),
                'products' => $products,
            ],
        ]);
    }
}
