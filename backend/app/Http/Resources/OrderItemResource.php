<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin OrderItem
 */
class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_sku' => $this->product_sku,
            'quantity' => $this->quantity,
            'unit_price_cents' => $this->unit_price_cents,
            'total_cents' => $this->total_cents,
            'unit_price_formatted' => '$' . number_format($this->unit_price_cents / 100, 2),
            'total_formatted' => '$' . number_format($this->total_cents / 100, 2),
        ];
    }
}
