<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderCollectionResource;
use App\Http\Resources\OrderResource;
use App\Repositories\OrderRepository;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly OrderService $orderService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);

        $filters = [
            'status' => $request->input('filter.status'),
            'date_from' => $request->input('filter.date_from'),
            'date_to' => $request->input('filter.date_to'),
            'search' => $request->input('filter.search'),
        ];

        $orders = $this->orderRepository->getAllForAdmin(array_filter($filters), $perPage);

        return response()->json(
            (new OrderCollectionResource($orders))->response()->getData(true)
        );
    }

    public function show(string $uuid): JsonResponse
    {
        $order = $this->orderRepository->getWithItems($uuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    public function updateStatus(Request $request, string $uuid): JsonResponse
    {
        $order = $this->orderRepository->findByUuid($uuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', array_column(OrderStatus::cases(), 'value'))],
            'tracking_number' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $newStatus = OrderStatus::from($validated['status']);

            if ($newStatus === OrderStatus::Cancelled) {
                $order = $this->orderService->cancelOrder($order);
            } else {
                $trackingNumber = $validated['tracking_number'] ?? null;
                $order = $this->orderService->transitionStatus($order, $newStatus, $trackingNumber);
            }

            return response()->json([
                'data' => new OrderResource($order),
                'message' => "Order status updated to {$newStatus->value}.",
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
