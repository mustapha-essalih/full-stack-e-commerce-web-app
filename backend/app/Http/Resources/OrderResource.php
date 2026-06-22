<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'user_id' => $this->user_id,
            'status' => $this->status,
            'subtotal_cents' => $this->subtotal_cents,
            'tax_cents' => $this->tax_cents,
            'shipping_cents' => $this->shipping_cents,
            'discount_cents' => $this->discount_cents,
            'total_cents' => $this->total_cents,
            'currency' => $this->currency,
            'coupon_code' => $this->coupon_code,
            'tracking_number' => $this->tracking_number,
            'subtotal_formatted' => '$' . number_format($this->subtotal_cents / 100, 2),
            'tax_formatted' => '$' . number_format($this->tax_cents / 100, 2),
            'shipping_formatted' => '$' . number_format($this->shipping_cents / 100, 2),
            'discount_formatted' => '$' . number_format($this->discount_cents / 100, 2),
            'total_formatted' => '$' . number_format($this->total_cents / 100, 2),
            'paid_at' => $this->paid_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'processing_at' => $this->processing_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'billing_address' => $this->billing_address ?? new AddressResource($this->whenLoaded('billingAddress')),
            'shipping_address' => $this->shipping_address ?? new AddressResource($this->whenLoaded('shippingAddress')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
        ];
    }
}
