<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CouponUsage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CouponUsage
 */
class CouponUsageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'coupon_id' => $this->coupon_id,
            'order_uuid' => $this->whenLoaded('order', fn () => $this->order->uuid),
            'order_status' => $this->whenLoaded('order', fn () => $this->order->status),
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'discount_cents' => $this->discount_cents,
            'used_at' => $this->used_at->toISOString(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
