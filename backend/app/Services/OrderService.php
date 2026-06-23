<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InventoryAdjustmentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderStatusChanged;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Stripe\Exception\ApiErrorException;
use Stripe\Refund;
use Stripe\Stripe;

class OrderService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly InventoryService $inventoryService,
    ) {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * @param array<string, mixed> $shippingAddress
     */
    public function createFromCheckout(Cart $cart, array $shippingAddress, ?User $user = null): Order
    {
        $cart->load('items.product');

        return DB::transaction(function () use ($cart, $shippingAddress, $user): Order {
            $subtotalCents = $cart->total_cents;

            $order = Order::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user?->id,
                'status' => OrderStatus::Pending->value,
                'subtotal_cents' => $subtotalCents,
                'discount_cents' => 0,
                'tax_cents' => 0,
                'shipping_cents' => 0,
                'total_cents' => $subtotalCents,
                'shipping_address' => $shippingAddress,
                'billing_address' => $shippingAddress,
            ]);

            foreach ($cart->items as $cartItem) {
                $product = $cartItem->product;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $cartItem->quantity,
                    'unit_price_cents' => $cartItem->unit_price_cents,
                    'total_cents' => $cartItem->quantity * $cartItem->unit_price_cents,
                ]);

                $this->inventoryService->reserveStock($product, $cartItem->quantity);
            }

            $this->cartService->clearCart($cart);

            return $order->fresh(['items', 'payment']);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function getOrderSummary(Order $order): array
    {
        $order->loadMissing(['items', 'payment']);

        return [
            'uuid' => $order->uuid,
            'status' => $order->status,
            'subtotal_cents' => $order->subtotal_cents,
            'discount_cents' => $order->discount_cents,
            'tax_cents' => $order->tax_cents,
            'shipping_cents' => $order->shipping_cents,
            'total_cents' => $order->total_cents,
            'subtotal_formatted' => '$' . number_format($order->subtotal_cents / 100, 2),
            'discount_formatted' => '$' . number_format($order->discount_cents / 100, 2),
            'tax_formatted' => '$' . number_format($order->tax_cents / 100, 2),
            'shipping_formatted' => '$' . number_format($order->shipping_cents / 100, 2),
            'total_formatted' => '$' . number_format($order->total_cents / 100, 2),
            'items' => $order->items->map(fn (OrderItem $item): array => [
                'product_name' => $item->product_name,
                'product_sku' => $item->product_sku,
                'quantity' => $item->quantity,
                'unit_price_cents' => $item->unit_price_cents,
                'total_cents' => $item->total_cents,
                'unit_price_formatted' => '$' . number_format($item->unit_price_cents / 100, 2),
                'total_formatted' => '$' . number_format($item->total_cents / 100, 2),
            ]),
            'shipping_address' => $order->shipping_address,
            'billing_address' => $order->billing_address,
            'payment' => $order->payment ? [
                'status' => $order->payment->status,
                'amount_cents' => $order->payment->amount_cents,
            ] : null,
            'created_at' => $order->created_at->toISOString(),
        ];
    }

    public function transitionStatus(Order $order, OrderStatus $newStatus, ?string $trackingNumber = null): Order
    {
        $currentStatus = OrderStatus::from($order->status);

        if (!$currentStatus->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$currentStatus->value} to {$newStatus->value}."
            );
        }

        DB::transaction(function () use ($order, $newStatus, $trackingNumber): void {
            $oldStatus = OrderStatus::from($order->status);

            match ($newStatus) {
                OrderStatus::Paid => $order->markAsPaid(),
                OrderStatus::Processing => $order->markAsProcessing(),
                OrderStatus::Shipped => $order->markAsShipped($trackingNumber ?? ''),
                OrderStatus::Delivered => $order->markAsDelivered(),
                OrderStatus::Cancelled => $order->cancel(),
                default => throw new \InvalidArgumentException("Cannot transition to {$newStatus->value} via this method."),
            };

            OrderStatusChanged::dispatch($order, $oldStatus, $newStatus);
        });

        return $order->fresh(['items', 'payment']);
    }

    public function cancelOrder(Order $order): Order
    {
        $currentStatus = OrderStatus::from($order->status);

        if (!$currentStatus->canTransitionTo(OrderStatus::Cancelled)) {
            throw new \InvalidArgumentException(
                "Order cannot be cancelled in its current status: {$currentStatus->value}."
            );
        }

        return DB::transaction(function () use ($order): Order {
            $oldStatus = OrderStatus::from($order->status);

            $order->load('items');

            foreach ($order->items as $item) {
                if ($item->product_id !== null && $item->product) {
                    $this->inventoryService->adjustStock(
                        $item->product,
                        $item->quantity,
                        InventoryAdjustmentType::Cancellation,
                        note: 'Order cancelled',
                    );
                }
            }

            $order->cancel();

            OrderStatusChanged::dispatch($order, $oldStatus, OrderStatus::Cancelled);

            return $order->fresh(['items', 'payment']);
        });
    }

    public function canBeCancelledByCustomer(Order $order): bool
    {
        $status = OrderStatus::from($order->status);

        return $status === OrderStatus::Pending || $status === OrderStatus::Paid;
    }

    public function refundOrder(Order $order): Order
    {
        if (!$order->isRefundable()) {
            throw new \InvalidArgumentException(
                "Order cannot be refunded in its current status: {$order->status}."
            );
        }

        $payment = $order->payment;

        if (!$payment || !$payment->stripe_payment_intent_id) {
            throw new \RuntimeException('No payment found for this order.');
        }

        return DB::transaction(function () use ($order, $payment): Order {
            try {
                Refund::create([
                    'payment_intent' => $payment->stripe_payment_intent_id,
                ]);
            } catch (ApiErrorException $e) {
                throw new \RuntimeException('Stripe refund failed: ' . $e->getMessage());
            }

            $order->load('items');

            foreach ($order->items as $item) {
                if ($item->product_id !== null && $item->product) {
                    $this->inventoryService->adjustStock(
                        $item->product,
                        $item->quantity,
                        InventoryAdjustmentType::Cancellation,
                        note: 'Order refunded',
                    );
                }
            }

            $order->markAsRefunded();

            $payment->status = PaymentStatus::Refunded->value;
            $payment->save();

            return $order->fresh(['items', 'payment']);
        });
    }
}
