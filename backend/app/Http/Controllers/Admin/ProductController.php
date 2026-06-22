<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkProductActionRequest;
use App\Http\Requests\ReorderImagesRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\UploadImagesRequest;
use App\Http\Resources\ProductCollectionResource;
use App\Http\Resources\ProductImageResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Repositories\ProductRepository;
use App\Services\ImageUploadService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly ProductRepository $productRepository,
        private readonly ImageUploadService $imageUploadService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($request->has('ids')) {
            $ids = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']])['ids'];
            $products = $this->productRepository->findByIds($ids);

            return response()->json([
                'data' => ProductResource::collection($products),
            ]);
        }

        $filters = $request->only([
            'search',
            'category_id',
            'min_price',
            'max_price',
            'in_stock',
            'sort',
            'direction',
            'per_page',
            'page',
        ]);

        $filters['include_inactive'] = true;
        $products = $this->productRepository->searchAndFilter($filters);

        return response()->json(new ProductCollectionResource($products));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->createProduct(
            $request->validated()
        );

        return response()->json([
            'data' => new ProductResource($product),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::withTrashed()
            ->with(['categories', 'images'])
            ->findOrFail($id);

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product = $this->productService->updateProduct(
            $product,
            $request->validated()
        );

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    public function bulkAction(BulkProductActionRequest $request): JsonResponse
    {
        $action = $request->input('action');
        $ids = $request->input('ids');

        if ($action === 'activate') {
            $this->productService->bulkActivate($ids);
        } elseif ($action === 'archive') {
            $this->productService->bulkArchive($ids);
        }

        return response()->json([
            'message' => "Products {$action}d successfully.",
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->productService->archiveProduct($product);

        return response()->json(['message' => 'Product archived successfully.']);
    }

    public function restore(int $id): JsonResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $this->productService->restoreProduct($product);

        return response()->json([
            'data' => new ProductResource($product->load(['categories', 'images'])),
        ]);
    }

    public function uploadImages(UploadImagesRequest $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $uploaded = [];

        foreach ($request->file('images', []) as $file) {
            $result = $this->imageUploadService->upload($file);

            $image = ProductImage::create([
                'product_id' => $product->id,
                'path' => $result['path'],
                'alt_text' => $file->getClientOriginalName(),
                'sort_order' => $product->images()->max('sort_order') + 1,
                'is_primary' => !$product->images()->exists(),
            ]);

            $uploaded[] = $image;
        }

        return response()->json([
            'data' => ProductImageResource::collection($uploaded),
        ], 201);
    }

    public function destroyImage(int $productId, int $imageId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $image = ProductImage::where('product_id', $product->id)
            ->findOrFail($imageId);

        $this->imageUploadService->delete($image->path);
        $image->delete();

        return response()->json(['message' => 'Image deleted successfully.']);
    }

    public function reorderImages(ReorderImagesRequest $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $this->productService->reorderImages($product, $request->validated('images', []));

        return response()->json(['message' => 'Images reordered successfully.']);
    }
}
