<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'price_cents' => $this->price_cents,
            'price_formatted' => $this->price_formatted,
            'compare_price_cents' => $this->compare_price_cents,
            'compare_price_formatted' => $this->compare_price_formatted,
            'sku' => $this->sku,
            'stock_quantity' => $this->stock_quantity,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'weight_grams' => $this->weight_grams,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'primary_image' => $this->when($this->relationLoaded('primaryImage') || $this->relationLoaded('images'), function (): ?ProductImageResource {
                $primary = $this->relationLoaded('primaryImage') && $this->primaryImage
                    ? $this->primaryImage
                    : $this->images->first();

                return $primary ? new ProductImageResource($primary) : null;
            }),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
