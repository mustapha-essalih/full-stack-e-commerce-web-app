<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\Product;
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

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $perPage = min((int) $request->input('per_page', 15), 100);

        $reviews = $user->reviews()
            ->with('product.primaryImage', 'product.images')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => ReviewResource::collection($reviews),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function store(StoreReviewRequest $request, string $slug): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Product $product */
        $product = Product::where('slug', $slug)->active()->firstOrFail();

        if (!$this->reviewService->canReview($user, $product)) {
            return response()->json([
                'message' => 'You are not eligible to review this product.',
            ], 403);
        }

        $order = $user->orders()
            ->whereHas('items', fn (Builder $q) => $q->where('product_id', $product->id))
            ->where('status', 'delivered')
            ->latest()
            ->firstOrFail();

        $review = $this->reviewService->createReview($user, $product, $order, $request->validated());

        return response()->json([
            'data' => new ReviewResource($review->load('user')),
        ], 201);
    }
}
