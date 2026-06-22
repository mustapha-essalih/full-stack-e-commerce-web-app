<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\WishlistRequest;
use App\Http\Resources\WishlistResource;
use App\Models\Product;
use App\Models\User;
use App\Services\WishlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function __construct(
        private readonly WishlistService $wishlistService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $perPage = min((int) $request->input('per_page', 15), 100);

        $items = $this->wishlistService->getForUser($user, $perPage);

        return response()->json([
            'data' => WishlistResource::collection($items),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(WishlistRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Product $product */
        $product = Product::findOrFail((int) $request->integer('product_id'));

        $wishlist = $this->wishlistService->add($user, $product);

        return response()->json([
            'data' => new WishlistResource($wishlist->load('product.primaryImage', 'product.categories', 'product.images')),
        ], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        /** @var Product $product */
        $product = Product::findOrFail((int) $request->integer('product_id'));

        $this->wishlistService->remove($user, $product);

        return response()->json([
            'message' => 'Removed from wishlist.',
        ]);
    }
}
