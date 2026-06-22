<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
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
        /** @var \App\Models\User $user */
        $user = $request->user();
        $perPage = min((int) $request->input('per_page', 15), 100);

        $orders = $this->orderRepository->findByUser($user, $perPage);

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

        /** @var \App\Models\User $user */
        $user = request()->user();

        if ($order->user_id !== $user->id) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    public function cancel(string $uuid): JsonResponse
    {
        $order = $this->orderRepository->findByUuid($uuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        /** @var \App\Models\User $user */
        $user = request()->user();

        if ($order->user_id !== $user->id) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$this->orderService->canBeCancelledByCustomer($order)) {
            return response()->json([
                'message' => 'This order cannot be cancelled.',
            ], 422);
        }

        try {
            $order = $this->orderService->cancelOrder($order);

            return response()->json([
                'data' => new OrderResource($order),
                'message' => 'Order cancelled successfully.',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
