<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class AdminCustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'is_suspended' => $this->is_suspended,
            'suspended_at' => $this->suspended_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'orders_count' => (int) ($this->orders_count ?? 0),
            'total_spent_cents' => (int) ($this->total_spent_cents ?? 0),
            'total_spent_formatted' => '$' . number_format(($this->total_spent_cents ?? 0) / 100, 2),
        ];
    }
}
