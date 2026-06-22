<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Checkout\ApplyCouponRequest;
use App\Http\Requests\Checkout\InitializeCheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use App\Repositories\CartRepository;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkoutService,
        private readonly CartRepository $cartRepository,
    ) {
    }

    public function initialize(InitializeCheckoutRequest $request): JsonResponse
    {
        $cart = $this->cartRepository->findOrCreateForRequest($request);
        $user = $this->resolveUser($request);

        if ($cart->items->isEmpty()) {
            return response()->json([
                'message' => 'Your cart is empty.',
            ], 422);
        }

        $result = $this->checkoutService->initializeCheckout(
            $cart,
            $user,
            $request->input('address'),
        );

        return response()->json([
            'data' => [
                'order' => new OrderResource($result['order']),
                'totals' => $result['totals'],
            ],
        ]);
    }

    public function show(string $orderUuid): JsonResponse
    {
        $order = $this->checkoutService->findOrderByUuid($orderUuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'order' => new OrderResource($order),
                'totals' => $this->checkoutService->calculateTotals($order),
            ],
        ]);
    }

    public function applyCoupon(ApplyCouponRequest $request, string $orderUuid): JsonResponse
    {
        $order = $this->checkoutService->findOrderByUuid($orderUuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$order->isDraft()) {
            return response()->json([
                'message' => 'Cannot modify a non-draft order.',
            ], 422);
        }

        try {
            $result = $this->checkoutService->applyOrRemoveCoupon($order, $request->input('code'));

            return response()->json([
                'data' => [
                    'order' => new OrderResource($result['order']),
                    'totals' => $result['totals'],
                    'discount' => $result['discount'],
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['code' => [$e->getMessage()]],
            ], 422);
        }
    }

    public function removeCoupon(string $orderUuid): JsonResponse
    {
        $order = $this->checkoutService->findOrderByUuid($orderUuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$order->isDraft()) {
            return response()->json([
                'message' => 'Cannot modify a non-draft order.',
            ], 422);
        }

        $result = $this->checkoutService->applyOrRemoveCoupon($order, null);

        return response()->json([
            'data' => [
                'order' => new OrderResource($result['order']),
                'totals' => $result['totals'],
            ],
        ]);
    }

    public function createPaymentIntent(string $orderUuid): JsonResponse
    {
        $order = $this->checkoutService->findOrderByUuid($orderUuid);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$order->isDraft()) {
            return response()->json([
                'message' => 'Order is not in draft status.',
            ], 422);
        }

        try {
            $result = $this->checkoutService->createPaymentIntent($order);

            return response()->json([
                'data' => [
                    'client_secret' => $result['client_secret'],
                    'payment_intent_id' => $result['payment_intent_id'],
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    private function resolveUser(Request $request): ?User
    {
        $bearerToken = $request->bearerToken();

        if (!$bearerToken) {
            return null;
        }

        /** @var PersonalAccessToken|null $accessToken */
        $accessToken = PersonalAccessToken::findToken($bearerToken);

        if (!$accessToken || $accessToken->expires_at?->isPast()) {
            return null;
        }

        $tokenable = $accessToken->tokenable;

        if ($tokenable instanceof User) {
            return $tokenable;
        }

        return null;
    }
}
