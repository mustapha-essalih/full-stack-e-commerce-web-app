<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\InventoryAdjustment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InventoryAdjustment */
class InventoryAdjustmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'type' => $this->type,
            'quantity_change' => $this->quantity_change,
            'quantity_after' => $this->quantity_after,
            'note' => $this->note,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
