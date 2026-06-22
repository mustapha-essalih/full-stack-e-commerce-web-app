<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderPaid;
use App\Events\OrderPaymentFailed;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class CheckoutService
{
    private const TAX_RATE = 0.10;
    private const FLAT_SHIPPING_CENTS = 599;
    private const CURRENCY = 'usd';

    public function __construct(
        private readonly CartService $cartService,
    ) {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * @param array<string, mixed> $addressData
     * @return array{order: Order, totals: array<string, int>}
     */
    public function initializeCheckout(Cart $cart, ?User $user, array $addressData): array
    {
        $validation = $this->cartService->validateCartForCheckout($cart);

        if (!$validation['valid']) {
            throw new \RuntimeException('Cart validation failed: ' . implode(', ', $validation['errors']));
        }

        $subtotalCents = $cart->total_cents;

        return DB::transaction(function () use ($cart, $user, $addressData, $subtotalCents): array {
            $address = Address::create([
                'user_id' => $user?->id,
                'first_name' => $addressData['first_name'],
                'last_name' => $addressData['last_name'],
                'line1' => $addressData['line1'],
                'line2' => $addressData['line2'] ?? null,
                'city' => $addressData['city'],
                'state' => $addressData['state'] ?? null,
                'postal_code' => $addressData['postal_code'] ?? null,
                'country_code' => $addressData['country_code'],
            ]);

            $order = Order::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user?->id,
                'status' => OrderStatus::Draft->value,
                'subtotal_cents' => $subtotalCents,
                'discount_cents' => 0,
                'billing_address_id' => $address->id,
                'shipping_address_id' => $address->id,
            ]);

            $totals = $this->calculateTotals($order);

            $order->updateQuietly([
                'tax_cents' => $totals['tax_cents'],
                'shipping_cents' => $totals['shipping_cents'],
                'discount_cents' => $totals['discount_cents'],
                'total_cents' => $totals['total_cents'],
            ]);

            $order->refresh();

            return [
                'order' => $order,
                'totals' => $totals,
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function applyOrRemoveCoupon(Order $order, ?string $code): array
    {
        if ($code === null) {
            $order->updateQuietly([
                'coupon_code' => null,
                'discount_cents' => 0,
            ]);

            $order->refresh();

            return [
                'order' => $order,
                'totals' => $this->calculateTotals($order),
                'discount' => 0,
            ];
        }

        // Phase 11 will complete coupon validation
        // Stub: no valid coupons yet
        throw new \RuntimeException('Invalid or expired coupon code.');
    }

    /**
     * @return array<string, int>
     */
    public function calculateTotals(Order $order): array
    {
        $subtotalCents = $order->subtotal_cents;
        $discountCents = $order->discount_cents;
        $taxableAmount = max(0, $subtotalCents - $discountCents);
        $taxCents = (int) round($taxableAmount * self::TAX_RATE);
        $shippingCents = self::FLAT_SHIPPING_CENTS;
        $totalCents = max(0, $subtotalCents - $discountCents + $taxCents + $shippingCents);

        return [
            'subtotal_cents' => $subtotalCents,
            'discount_cents' => $discountCents,
            'tax_cents' => $taxCents,
            'shipping_cents' => $shippingCents,
            'total_cents' => $totalCents,
        ];
    }

    /**
     * @return array{client_secret: string, payment_intent_id: string}
     */
    public function createPaymentIntent(Order $order): array
    {
        if (!$order->isDraft()) {
            throw new \RuntimeException('Order is not in draft status.');
        }

        $totals = $this->calculateTotals($order);

        try {
            /** @var PaymentIntent $intent */
            $intent = PaymentIntent::create([
                'amount' => $totals['total_cents'],
                'currency' => self::CURRENCY,
                'metadata' => [
                    'order_uuid' => $order->uuid,
                    'order_id' => (string) $order->id,
                ],
            ]);
        } catch (ApiErrorException $e) {
            throw new \RuntimeException('Failed to create payment intent: ' . $e->getMessage());
        }

        Payment::create([
            'order_id' => $order->id,
            'stripe_payment_intent_id' => $intent->id,
            'amount_cents' => $totals['total_cents'],
            'currency' => self::CURRENCY,
            'status' => PaymentStatus::Pending->value,
            'metadata' => $intent->metadata->toArray(),
        ]);

        $order->updateQuietly([
            'tax_cents' => $totals['tax_cents'],
            'shipping_cents' => $totals['shipping_cents'],
            'discount_cents' => $totals['discount_cents'],
            'total_cents' => $totals['total_cents'],
        ]);

        return [
            'client_secret' => $intent->client_secret,
            'payment_intent_id' => $intent->id,
        ];
    }

    public function confirmOrder(string $paymentIntentId): Order
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (!$payment) {
            throw new \RuntimeException("Payment intent {$paymentIntentId} not found.");
        }

        $order = $payment->order;

        if ($order->isPaid()) {
            return $order;
        }

        DB::transaction(function () use ($payment, $order): void {
            try {
                /** @var PaymentIntent $intent */
                $intent = PaymentIntent::retrieve($paymentIntentId);
                $payment->markAsSucceeded($intent->charges->data[0]?->id ?? null);
                $order->markAsPaid();

                OrderPaid::dispatch($order);
            } catch (ApiErrorException $e) {
                $payment->markAsFailed();
                OrderPaymentFailed::dispatch($order, $e->getMessage());
                throw new \RuntimeException('Payment confirmation failed: ' . $e->getMessage());
            }
        });

        return $order->fresh(['billingAddress', 'payment']);
    }

    public function handlePaymentFailed(string $paymentIntentId): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (!$payment) {
            return;
        }

        $payment->markAsFailed();
        OrderPaymentFailed::dispatch($payment->order, 'Payment failed.');
    }

    public function findOrderByUuid(string $uuid): ?Order
    {
        /** @var Order|null $order */
        $order = Order::with(['billingAddress', 'payment'])->where('uuid', $uuid)->first();

        return $order;
    }

    /**
     * @return array<string, mixed>
     */
    public function getCheckoutData(Order $order): array
    {
        $totals = $this->calculateTotals($order);

        return [
            'order' => $order,
            'totals' => $totals,
            'client_secret' => $order->payment?->isPending() === true
                ? $this->getExistingClientSecret($order)
                : null,
        ];
    }

    private function getExistingClientSecret(Order $order): ?string
    {
        $payment = $order->payment;

        if (!$payment || !$payment->isPending()) {
            return null;
        }

        try {
            /** @var PaymentIntent $intent */
            $intent = PaymentIntent::retrieve($payment->stripe_payment_intent_id);

            return $intent->client_secret;
        } catch (ApiErrorException) {
            return null;
        }
    }
}
