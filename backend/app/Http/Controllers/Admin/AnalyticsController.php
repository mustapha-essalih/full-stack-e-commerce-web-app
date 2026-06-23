<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analyticsService,
    ) {
    }

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = new \Illuminate\Support\Carbon($validated['from']);
        $to = new \Illuminate\Support\Carbon($validated['to']);

        return response()->json([
            'data' => $this->analyticsService->getRevenueSummary($from, $to),
        ]);
    }

    public function revenueChart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = new \Illuminate\Support\Carbon($validated['from']);
        $to = new \Illuminate\Support\Carbon($validated['to']);

        return response()->json([
            'data' => $this->analyticsService->getDailyRevenue($from, $to),
        ]);
    }

    public function topProducts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $from = new \Illuminate\Support\Carbon($validated['from']);
        $to = new \Illuminate\Support\Carbon($validated['to']);
        $limit = (int) ($validated['limit'] ?? 10);

        return response()->json([
            'data' => $this->analyticsService->getTopProducts($from, $to, $limit),
        ]);
    }

    public function customers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = new \Illuminate\Support\Carbon($validated['from']);
        $to = new \Illuminate\Support\Carbon($validated['to']);

        return response()->json([
            'data' => $this->analyticsService->getNewVsReturningCustomers($from, $to),
        ]);
    }

    public function coupons(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = new \Illuminate\Support\Carbon($validated['from']);
        $to = new \Illuminate\Support\Carbon($validated['to']);

        return response()->json([
            'data' => $this->analyticsService->getCouponUsageSummary($from, $to),
        ]);
    }
}
