<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read int $id
 * @property int $coupon_id
 * @property int $order_id
 * @property int|null $user_id
 * @property int $discount_cents
 * @property Carbon $used_at
 * @property-read Carbon $created_at
 * @property-read Carbon $updated_at
 * @property-read Coupon $coupon
 * @property-read Order $order
 * @property-read User|null $user
 */
class CouponUsage extends Model
{
    /** @use HasFactory<\Database\Factories\CouponUsageFactory> */
    use HasFactory;

    protected $fillable = [
        'coupon_id',
        'order_id',
        'user_id',
        'discount_cents',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'discount_cents' => 'integer',
            'used_at' => 'datetime',
        ];
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
