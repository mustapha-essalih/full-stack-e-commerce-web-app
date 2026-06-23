<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CouponService
{
    /**
     * @return array{valid: bool, error?: string, coupon?: Coupon, discount_cents?: int}
     */
    public function validateCoupon(string $code, int $subtotalCents, ?User $user): array
    {
        return DB::transaction(function () use ($code, $subtotalCents, $user): array {
            /** @var Coupon|null $coupon */
            $coupon = Coupon::where('code', $code)
                ->lockForUpdate()
                ->first();

            if (!$coupon) {
                return ['valid' => false, 'error' => 'Invalid coupon code.'];
            }

            if (!$coupon->is_active) {
                return ['valid' => false, 'error' => 'This coupon is no longer active.'];
            }

            if ($coupon->expires_at && $coupon->expires_at->isPast()) {
                return ['valid' => false, 'error' => 'This coupon has expired.'];
            }

            if ($coupon->starts_at && $coupon->starts_at->isFuture()) {
                return ['valid' => false, 'error' => 'This coupon is not yet available.'];
            }

            if ($coupon->usage_limit && $coupon->usage_count >= $coupon->usage_limit) {
                return ['valid' => false, 'error' => 'This coupon has reached its usage limit.'];
            }

            if ($user && $coupon->per_customer_limit) {
                $customerUsage = CouponUsage::where('coupon_id', $coupon->id)
                    ->where('user_id', $user->id)
                    ->count();

                if ($customerUsage >= $coupon->per_customer_limit) {
                    return ['valid' => false, 'error' => 'You have reached the usage limit for this coupon.'];
                }
            }

            if ($coupon->minimum_order_cents !== null && $subtotalCents < $coupon->minimum_order_cents) {
                $minimumFormatted = '$' . number_format($coupon->minimum_order_cents / 100, 2);

                return ['valid' => false, 'error' => "Minimum order amount of {$minimumFormatted} is required for this coupon."];
            }

            $discountCents = $this->calculateDiscount($coupon, $subtotalCents);

            return [
                'valid' => true,
                'coupon' => $coupon,
                'discount_cents' => $discountCents,
            ];
        });
    }

    public function applyCoupon(Order $order, Coupon $coupon, int $discountCents): Order
    {
        $order->updateQuietly([
            'coupon_id' => $coupon->id,
            'coupon_code' => $coupon->code,
            'discount_cents' => $discountCents,
        ]);

        return $order->fresh();
    }

    public function recordUsage(Coupon $coupon, Order $order, ?User $user): void
    {
        DB::transaction(function () use ($coupon, $order, $user): void {
            $coupon->refresh();
            $coupon = Coupon::lockForUpdate()->find($coupon->id);

            if (!$coupon) {
                return;
            }

            if ($coupon->usage_limit && $coupon->usage_count >= $coupon->usage_limit) {
                return;
            }

            CouponUsage::create([
                'coupon_id' => $coupon->id,
                'order_id' => $order->id,
                'user_id' => $user?->id,
                'discount_cents' => $order->discount_cents,
                'used_at' => now(),
            ]);

            $coupon->increment('usage_count');
        });
    }

    public function createCoupon(array $data): Coupon
    {
        return DB::transaction(function () use ($data): Coupon {
            return Coupon::create([
                'code' => $data['code'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'value' => (int) $data['value'],
                'minimum_order_cents' => $data['minimum_order_cents'] ?? null,
                'usage_limit' => $data['usage_limit'] ?? null,
                'usage_count' => 0,
                'per_customer_limit' => $data['per_customer_limit'] ?? null,
                'starts_at' => $data['starts_at'] ?? null,
                'expires_at' => $data['expires_at'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });
    }

    public function updateCoupon(Coupon $coupon, array $data): Coupon
    {
        $coupon->update([
            'code' => $data['code'] ?? $coupon->code,
            'description' => $data['description'] ?? $coupon->description,
            'type' => $data['type'] ?? $coupon->type,
            'value' => isset($data['value']) ? (int) $data['value'] : $coupon->value,
            'minimum_order_cents' => array_key_exists('minimum_order_cents', $data) ? $data['minimum_order_cents'] : $coupon->minimum_order_cents,
            'usage_limit' => array_key_exists('usage_limit', $data) ? $data['usage_limit'] : $coupon->usage_limit,
            'per_customer_limit' => array_key_exists('per_customer_limit', $data) ? $data['per_customer_limit'] : $coupon->per_customer_limit,
            'starts_at' => array_key_exists('starts_at', $data) ? $data['starts_at'] : $coupon->starts_at,
            'expires_at' => array_key_exists('expires_at', $data) ? $data['expires_at'] : $coupon->expires_at,
            'is_active' => $data['is_active'] ?? $coupon->is_active,
        ]);

        return $coupon->fresh();
    }

    public function archiveCoupon(Coupon $coupon): void
    {
        $coupon->update(['is_active' => false]);
        $coupon->delete();
    }

    private function calculateDiscount(Coupon $coupon, int $subtotalCents): int
    {
        if ($coupon->type === 'percentage') {
            return (int) round($subtotalCents * $coupon->value / 100);
        }

        return min($coupon->value, $subtotalCents);
    }
}
