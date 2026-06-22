<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property-read int $id
 * @property-read string $uuid
 * @property int|null $user_id
 * @property string $status
 * @property int $subtotal_cents
 * @property int $discount_cents
 * @property int $tax_cents
 * @property int $shipping_cents
 * @property int $total_cents
 * @property string $currency
 * @property string|null $notes
 * @property string|null $coupon_code
 * @property int|null $billing_address_id
 * @property int|null $shipping_address_id
 * @property array|null $shipping_address
 * @property array|null $billing_address
 * @property string|null $stripe_payment_intent_id
 * @property int|null $coupon_id
 * @property string|null $tracking_number
 * @property Carbon|null $paid_at
 * @property Carbon|null $cancelled_at
 * @property Carbon|null $shipped_at
 * @property Carbon|null $delivered_at
 * @property Carbon|null $processing_at
 * @property-read Carbon $created_at
 * @property-read Carbon $updated_at
 * @property-read User|null $user
 * @property-read Payment|null $payment
 * @property-read Address|null $billingAddress
 * @property-read Address|null $shippingAddress
 * @property-read Coupon|null $coupon
 * @property-read Collection<OrderItem> $items
 */
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
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
        'shipping_address',
        'billing_address',
        'stripe_payment_intent_id',
        'coupon_id',
        'tracking_number',
        'paid_at',
        'cancelled_at',
        'shipped_at',
        'delivered_at',
        'processing_at',
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
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'processing_at' => 'datetime',
            'shipping_address' => 'array',
            'billing_address' => 'array',
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

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isPending(): bool
    {
        return $this->status === OrderStatus::Pending->value;
    }

    public function isPaid(): bool
    {
        return $this->status === OrderStatus::Paid->value;
    }

    public function isCancelled(): bool
    {
        return $this->status === OrderStatus::Cancelled->value;
    }

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::Paid->value;
        $this->paid_at = now();
        $this->save();
    }

    public function markAsProcessing(): void
    {
        $this->status = OrderStatus::Processing->value;
        $this->processing_at = now();
        $this->save();
    }

    public function markAsShipped(string $trackingNumber): void
    {
        $this->status = OrderStatus::Shipped->value;
        $this->tracking_number = $trackingNumber;
        $this->shipped_at = now();
        $this->save();
    }

    public function markAsDelivered(): void
    {
        $this->status = OrderStatus::Delivered->value;
        $this->delivered_at = now();
        $this->save();
    }

    public function cancel(): void
    {
        $this->status = OrderStatus::Cancelled->value;
        $this->cancelled_at = now();
        $this->save();
    }
}
