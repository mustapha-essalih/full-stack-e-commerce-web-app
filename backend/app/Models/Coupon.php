<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\CouponFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property-read int $id
 * @property string $code
 * @property string|null $description
 * @property string $type
 * @property int $value
 * @property int|null $minimum_order_cents
 * @property int|null $usage_limit
 * @property int $usage_count
 * @property int|null $per_customer_limit
 * @property Carbon|null $starts_at
 * @property Carbon|null $expires_at
 * @property bool $is_active
 * @property Carbon|null $deleted_at
 * @property-read Carbon $created_at
 * @property-read Carbon $updated_at
 * @property-read string $type_formatted
 * @property-read string $value_formatted
 */
class Coupon extends Model
{
    /** @use HasFactory<CouponFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'minimum_order_cents',
        'usage_limit',
        'usage_count',
        'per_customer_limit',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'minimum_order_cents' => 'integer',
            'usage_limit' => 'integer',
            'usage_count' => 'integer',
            'per_customer_limit' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function isValid(?User $user = null, ?int $orderSubtotalCents = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        if ($user && $this->per_customer_limit) {
            $customerUsage = $this->usages()
                ->where('user_id', $user->id)
                ->count();

            if ($customerUsage >= $this->per_customer_limit) {
                return false;
            }
        }

        if ($orderSubtotalCents !== null && $this->minimum_order_cents !== null && $orderSubtotalCents < $this->minimum_order_cents) {
            return false;
        }

        return true;
    }

    public function scopeActive($query): void
    {
        $query->where('is_active', true)
            ->where(function ($q): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->where(function ($q): void {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            });
    }

    public function getTypeFormattedAttribute(): string
    {
        return $this->type === 'percentage' ? 'Percentage' : 'Fixed Amount';
    }

    public function getValueFormattedAttribute(): string
    {
        if ($this->type === 'percentage') {
            return $this->value . '%';
        }

        return '$' . number_format($this->value / 100, 2);
    }
}
