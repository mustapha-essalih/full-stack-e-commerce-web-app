<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Coupon
 */
class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'type' => $this->type,
            'value' => $this->value,
            'minimum_order_cents' => $this->minimum_order_cents,
            'usage_limit' => $this->usage_limit,
            'usage_count' => $this->usage_count,
            'per_customer_limit' => $this->per_customer_limit,
            'starts_at' => $this->starts_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'is_active' => $this->is_active,
            'type_formatted' => $this->type_formatted,
            'value_formatted' => $this->value_formatted,
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
