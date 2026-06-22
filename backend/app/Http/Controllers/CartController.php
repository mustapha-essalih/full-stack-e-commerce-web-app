<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AddCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Models\Product;
use App\Repositories\CartRepository;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private readonly CartRepository $cartRepository,
        private readonly CartService $cartService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->cartRepository->findOrCreateForRequest($request);

        $cart->load('items.product');

        return response()->json([
            'data' => new CartResource($cart),
        ]);
    }

    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $cart = $this->cartRepository->findOrCreateForRequest($request);

        /** @var Product|null $product */
        $product = Product::find((int) $request->integer('product_id'));

        if (!$product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        $item = $this->cartService->addItem($cart, $product, (int) $request->integer('quantity'));

        $cart->load('items.product');

        return response()->json([
            'data' => [
                'cart' => new CartResource($cart),
                'item' => $item,
            ],
        ], 201);
    }

    public function updateItemQuantity(UpdateCartItemRequest $request, CartItem $cartItem): JsonResponse
    {
        $cart = $cartItem->cart;

        if (!$cart) {
            return response()->json(['message' => 'Cart not found.'], 404);
        }

        $this->cartService->updateItemQuantity($cartItem, (int) $request->integer('quantity'));

        $cart->load('items.product');

        return response()->json([
            'data' => new CartResource($cart),
        ]);
    }

    public function removeItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $this->cartService->removeItem($cartItem);

        $cart = $this->cartRepository->findOrCreateForRequest($request);
        $cart->load('items.product');

        return response()->json([
            'data' => new CartResource($cart),
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->cartRepository->findOrCreateForRequest($request);
        $this->cartService->clearCart($cart);

        $cart->load('items.product');

        return response()->json([
            'data' => new CartResource($cart),
        ]);
    }
}
