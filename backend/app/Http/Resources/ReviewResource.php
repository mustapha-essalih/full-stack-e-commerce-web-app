<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reviewerName = null;
        if ($this->relationLoaded('user') && $this->user) {
            $nameParts = explode(' ', $this->user->name, 2);
            $firstName = $nameParts[0];
            $lastInitial = isset($nameParts[1]) ? mb_substr($nameParts[1], 0, 1) . '.' : '';
            $reviewerName = $lastInitial ? "{$firstName} {$lastInitial}" : $firstName;
        }

        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'reviewer_name' => $reviewerName,
            'is_approved' => $this->is_approved,
            'is_flagged' => $this->is_flagged,
            'approved_at' => $this->approved_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
