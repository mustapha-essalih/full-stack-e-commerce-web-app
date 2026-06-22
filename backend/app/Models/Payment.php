<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'stripe_payment_intent_id',
        'amount_cents',
        'currency',
        'status',
        'stripe_charge_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isPending(): bool
    {
        return $this->status === PaymentStatus::Pending->value;
    }

    public function isSucceeded(): bool
    {
        return $this->status === PaymentStatus::Succeeded->value;
    }

    public function markAsSucceeded(?string $chargeId = null): void
    {
        $this->status = PaymentStatus::Succeeded->value;
        $this->stripe_charge_id = $chargeId;
        $this->save();
    }

    public function markAsFailed(): void
    {
        $this->status = PaymentStatus::Failed->value;
        $this->save();
    }
}
