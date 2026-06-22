<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Payment
 */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'stripe_charge_id' => $this->stripe_charge_id,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
