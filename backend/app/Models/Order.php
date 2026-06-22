<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'status',
        'subtotal_cents',
        'tax_cents',
        'shipping_cents',
        'discount_cents',
        'total_cents',
        'currency',
        'notes',
        'coupon_code',
        'billing_address_id',
        'shipping_address_id',
        'paid_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_cents' => 'integer',
            'tax_cents' => 'integer',
            'shipping_cents' => 'integer',
            'discount_cents' => 'integer',
            'total_cents' => 'integer',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            if ($order->uuid === null) {
                $order->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'billing_address_id');
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'shipping_address_id');
    }

    public function isDraft(): bool
    {
        return $this->status === OrderStatus::Draft->value;
    }

    public function isPaid(): bool
    {
        return $this->status === OrderStatus::Paid->value;
    }

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::Paid->value;
        $this->paid_at = now();
        $this->save();
    }
}
