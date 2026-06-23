<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class AdminCustomerDetailResource extends JsonResource
{
    /**
     * @param array<string, mixed> $extra
     */
    public function __construct(mixed $resource, private array $extra = [])
    {
        parent::__construct($resource);
    }

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
            'orders_count' => $this->extra['orders_count'] ?? 0,
            'total_spent_cents' => $this->extra['total_spent_cents'] ?? 0,
            'total_spent_formatted' => $this->extra['total_spent_formatted'] ?? '$0.00',
            'recent_orders' => OrderResource::collection($this->extra['recent_orders'] ?? []),
        ];
    }
}
