<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponFormRequest;
use App\Http\Resources\CouponResource;
use App\Http\Resources\CouponUsageResource;
use App\Models\Coupon;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(
        private readonly CouponService $couponService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);

        $query = Coupon::query();

        if ($request->input('filter.search')) {
            $search = $request->input('filter.search');
            $query->where('code', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDir = $request->input('direction', 'desc');

        $allowedSortFields = ['code', 'type', 'value', 'usage_count', 'expires_at', 'is_active', 'created_at'];
        if (!in_array($sortField, $allowedSortFields, true)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');

        $coupons = $query->paginate($perPage);

        return response()->json([
            'data' => CouponResource::collection($coupons),
            'meta' => [
                'current_page' => $coupons->currentPage(),
                'last_page' => $coupons->lastPage(),
                'per_page' => $coupons->perPage(),
                'total' => $coupons->total(),
            ],
        ]);
    }

    public function store(CouponFormRequest $request): JsonResponse
    {
        $coupon = $this->couponService->createCoupon($request->validated());

        return response()->json([
            'data' => new CouponResource($coupon),
            'message' => 'Coupon created successfully.',
        ], 201);
    }

    public function show(Coupon $coupon): JsonResponse
    {
        $coupon->loadCount('usages');

        return response()->json([
            'data' => new CouponResource($coupon),
        ]);
    }

    public function update(CouponFormRequest $request, Coupon $coupon): JsonResponse
    {
        $coupon = $this->couponService->updateCoupon($coupon, $request->validated());

        return response()->json([
            'data' => new CouponResource($coupon),
            'message' => 'Coupon updated successfully.',
        ]);
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $this->couponService->archiveCoupon($coupon);

        return response()->json([
            'message' => 'Coupon archived successfully.',
        ]);
    }

    public function usages(Request $request, Coupon $coupon): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);

        $usages = $coupon->usages()
            ->with(['order', 'user'])
            ->orderBy('used_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => CouponUsageResource::collection($usages),
            'meta' => [
                'current_page' => $usages->currentPage(),
                'last_page' => $usages->lastPage(),
                'per_page' => $usages->perPage(),
                'total' => $usages->total(),
            ],
        ]);
    }
}
