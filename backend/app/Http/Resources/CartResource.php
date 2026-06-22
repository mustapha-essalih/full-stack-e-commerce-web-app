<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Cart */
class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'total_cents' => $this->total_cents,
            'item_count' => $this->item_count,
        ];
    }
}
