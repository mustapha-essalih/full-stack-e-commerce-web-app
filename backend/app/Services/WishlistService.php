<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WishlistService
{
    public function getForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $user->wishlist()
            ->with('product.primaryImage', 'product.categories', 'product.images')
            ->paginate($perPage);
    }

    public function add(User $user, Product $product): Wishlist
    {
        /** @var Wishlist $wishlist */
        $wishlist = Wishlist::firstOrCreate([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        return $wishlist;
    }

    public function remove(User $user, Product $product): void
    {
        Wishlist::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->delete();
    }
}
