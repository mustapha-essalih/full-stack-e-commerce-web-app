<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CouponFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $couponId = $this->route('coupon');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:coupons,code,' . ($couponId ? (int) $couponId : 'NULL'),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'type' => ['required', 'string', 'in:percentage,fixed_amount'],
            'value' => ['required', 'integer', 'min:1'],
            'minimum_order_cents' => ['nullable', 'integer', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_customer_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'This coupon code already exists.',
            'value.min' => 'The coupon value must be at least 1.',
            'expires_at.after_or_equal' => 'Expiry date must be after the start date.',
        ];
    }
}
