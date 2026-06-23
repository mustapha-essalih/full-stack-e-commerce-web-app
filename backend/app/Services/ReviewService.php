<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ReviewService
{
    public function canReview(User $user, Product $product): bool
    {
        $hasDeliveredOrder = $user->orders()
            ->whereHas('items', fn (Builder $q) => $q->where('product_id', $product->id))
            ->where('status', 'delivered')
            ->exists();

        if (!$hasDeliveredOrder) {
            return false;
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        return !$alreadyReviewed;
    }

    public function createReview(User $user, Product $product, Order $order, array $data): Review
    {
        return Review::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'body' => $data['body'] ?? null,
        ]);
    }

    public function approveReview(Review $review): void
    {
        $review->update([
            'is_approved' => true,
            'approved_at' => now(),
        ]);
    }

    public function rejectReview(Review $review): void
    {
        $review->update([
            'is_approved' => false,
            'approved_at' => null,
        ]);
    }

    public function flagReview(Review $review): void
    {
        $review->update([
            'is_flagged' => !$review->is_flagged,
        ]);
    }

    public function getApprovedForProduct(Product $product, int $perPage = 15): LengthAwarePaginator
    {
        return $product->reviews()
            ->approved()
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function getAllFiltered(?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Review::with(['product', 'user']);

        if ($status === 'pending') {
            $query->where('is_approved', false)->where('is_flagged', false);
        } elseif ($status === 'approved') {
            $query->where('is_approved', true);
        } elseif ($status === 'flagged') {
            $query->where('is_flagged', true);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }
}
