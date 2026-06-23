<?php

declare(strict_types=1);

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Services\ReviewService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviewService,
    ) {}

    public function eligibility(Request $request, string $slug): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'data' => [
                    'eligible' => false,
                    'already_reviewed' => false,
                    'is_authenticated' => false,
                ],
            ]);
        }

        $product = Product::where('slug', $slug)->active()->firstOrFail();

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        $eligible = !$alreadyReviewed && $user->orders()
            ->whereHas('items', fn (Builder $q) => $q->where('product_id', $product->id))
            ->where('status', 'delivered')
            ->exists();

        return response()->json([
            'data' => [
                'eligible' => $eligible,
                'already_reviewed' => $alreadyReviewed,
                'is_authenticated' => true,
            ],
        ]);
    }

    public function index(Request $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->active()->firstOrFail();

        $perPage = min((int) $request->input('per_page', 15), 100);

        $reviews = $this->reviewService->getApprovedForProduct($product, $perPage);

        $averageRating = $product->reviews()
            ->approved()
            ->avg('rating');

        $reviewCount = $product->reviews()
            ->approved()
            ->count();

        return response()->json([
            'data' => ReviewResource::collection($reviews),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
                'average_rating' => $averageRating ? round((float) $averageRating, 1) : null,
                'review_count' => $reviewCount,
            ],
        ]);
    }
}
