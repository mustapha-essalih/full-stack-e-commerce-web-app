<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Event;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkoutService,
    ) {
    }

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (!$sigHeader || !$webhookSecret) {
            Log::warning('Stripe webhook: missing signature header or webhook secret.');

            return response()->json(['message' => 'Invalid request.'], 400);
        }

        try {
            /** @var Event $event */
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook: invalid signature.', [
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $paymentIntentId = $event->data->object->id ?? null;

        if (!$paymentIntentId) {
            Log::warning('Stripe webhook: no payment intent ID in event.', [
                'event_type' => $event->type,
            ]);

            return response()->json(['message' => 'Missing payment intent.'], 400);
        }

        match ($event->type) {
            'payment_intent.succeeded' => $this->handleSucceededPayment($paymentIntentId),
            'payment_intent.payment_failed' => $this->handleFailedPayment($paymentIntentId),
            default => Log::info('Stripe webhook: unhandled event type.', [
                'type' => $event->type,
            ]),
        };

        return response()->json(['received' => true]);
    }

    private function handleSucceededPayment(string $paymentIntentId): void
    {
        try {
            $this->checkoutService->confirmOrder($paymentIntentId);
            Log::info('Stripe webhook: payment succeeded.', [
                'payment_intent' => $paymentIntentId,
            ]);
        } catch (\RuntimeException $e) {
            Log::error('Stripe webhook: failed to confirm order.', [
                'payment_intent' => $paymentIntentId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function handleFailedPayment(string $paymentIntentId): void
    {
        $this->checkoutService->handlePaymentFailed($paymentIntentId);
        Log::info('Stripe webhook: payment failed.', [
            'payment_intent' => $paymentIntentId,
        ]);
    }
}
