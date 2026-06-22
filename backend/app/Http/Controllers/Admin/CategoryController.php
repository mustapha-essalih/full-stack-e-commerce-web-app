<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Repositories\CategoryRepository;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categoryService,
        private readonly CategoryRepository $categoryRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($request->boolean('tree')) {
            $categories = $this->categoryService->getTree();
        } else {
            $categories = $this->categoryRepository->getAll();
        }

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categoryService->createCategory(
            $request->validated()
        );

        return response()->json([
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->load('children');

        return response()->json([
            'data' => new CategoryResource($category),
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category = $this->categoryService->updateCategory(
            $category,
            $request->validated()
        );

        return response()->json([
            'data' => new CategoryResource($category),
        ]);
    }

    public function tree(): JsonResponse
    {
        $categories = $this->categoryService->getTree();

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $this->categoryService->archiveCategory($category);

        return response()->json(['message' => 'Category archived successfully.']);
    }
}
