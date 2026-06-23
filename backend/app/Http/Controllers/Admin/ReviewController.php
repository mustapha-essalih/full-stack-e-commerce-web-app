<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviewService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);
        $status = $request->input('filter.status');

        $reviews = $this->reviewService->getAllFiltered($status, $perPage);

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

    public function approve(Review $review): JsonResponse
    {
        $this->reviewService->approveReview($review);

        return response()->json([
            'data' => new ReviewResource($review->fresh()->load('product', 'user')),
            'message' => 'Review approved.',
        ]);
    }

    public function reject(Review $review): JsonResponse
    {
        $this->reviewService->rejectReview($review);

        return response()->json([
            'data' => new ReviewResource($review->fresh()->load('product', 'user')),
            'message' => 'Review rejected.',
        ]);
    }

    public function flag(Review $review): JsonResponse
    {
        $this->reviewService->flagReview($review);

        return response()->json([
            'data' => new ReviewResource($review->fresh()->load('product', 'user')),
            'message' => $review->fresh()->is_flagged ? 'Review flagged.' : 'Review unflagged.',
        ]);
    }
}
