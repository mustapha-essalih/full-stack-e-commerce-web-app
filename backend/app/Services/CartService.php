<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CartService
{
    /**
     * @return array{valid: bool, errors: array<int, array{product_id: int, message: string}>}
     */
    public function validateCartForCheckout(Cart $cart): array
    {
        $cart->load('items.product');

        $errors = [];

        foreach ($cart->items as $item) {
            $product = $item->product;

            if ($product->stock_quantity < $item->quantity) {
                $errors[] = [
                    'product_id' => $product->id,
                    'message' => "Insufficient stock for {$product->name}. Available: {$product->stock_quantity}, requested: {$item->quantity}.",
                ];

                continue;
            }

            if ($product->price_cents !== $item->unit_price_cents) {
                $errors[] = [
                    'product_id' => $product->id,
                    'message' => "Price changed for {$product->name}. Was: \$" . number_format($item->unit_price_cents / 100, 2) . ', now: $' . number_format($product->price_cents / 100, 2) . '.',
                ];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    public function addItem(Cart $cart, Product $product, int $quantity): CartItem
    {
        return DB::transaction(function () use ($cart, $product, $quantity): CartItem {
            $cart->load('items.product');

            if ($product->stock_quantity < $quantity) {
                abort(422, "Only {$product->stock_quantity} units of {$product->name} are available.");
            }

            /** @var CartItem|null $existing */
            $existing = $cart->items->firstWhere('product_id', $product->id);

            if ($existing) {
                $newQuantity = $existing->quantity + $quantity;

                if ($product->stock_quantity < $newQuantity) {
                    abort(422, "Cannot add {$quantity} more. Only {$product->stock_quantity} units of {$product->name} are available.");
                }

                $existing->update([
                    'quantity' => $newQuantity,
                    'unit_price_cents' => $product->price_cents,
                ]);

                return $existing->fresh();
            }

            /** @var CartItem $item */
            $item = CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'unit_price_cents' => $product->price_cents,
            ]);

            return $item->load('product');
        });
    }

    public function updateItemQuantity(CartItem $item, int $quantity): CartItem
    {
        return DB::transaction(function () use ($item, $quantity): CartItem {
            $product = $item->product;

            if ($product->stock_quantity < $quantity) {
                abort(422, "Only {$product->stock_quantity} units of {$product->name} are available.");
            }

            if ($quantity < 1) {
                abort(422, 'Quantity must be at least 1.');
            }

            $item->update([
                'quantity' => $quantity,
                'unit_price_cents' => $product->price_cents,
            ]);

            return $item->fresh()->load('product');
        });
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
    }

    public function clearCart(Cart $cart): void
    {
        $cart->items()->delete();
    }

    public function mergeGuestCartIntoUserCart(Cart $guestCart, Cart $userCart): Cart
    {
        return DB::transaction(function () use ($guestCart, $userCart): Cart {
            $userCart->load('items.product');
            $guestCart->load('items.product');

            foreach ($guestCart->items as $guestItem) {
                /** @var CartItem|null $existing */
                $existing = $userCart->items->firstWhere('product_id', $guestItem->product_id);

                if ($existing) {
                    $existing->update([
                        'quantity' => $existing->quantity + $guestItem->quantity,
                    ]);
                } else {
                    $guestItem->update(['cart_id' => $userCart->id]);
                }
            }

            $guestCart->delete();

            return $userCart->fresh()->load('items.product');
        });
    }
}
