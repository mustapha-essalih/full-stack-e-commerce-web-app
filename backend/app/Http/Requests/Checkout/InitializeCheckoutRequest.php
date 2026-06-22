<?php

declare(strict_types=1);

namespace App\Http\Requests\Checkout;

use Illuminate\Foundation\Http\FormRequest;

class InitializeCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address.first_name' => ['required', 'string', 'max:255'],
            'address.last_name' => ['required', 'string', 'max:255'],
            'address.line1' => ['required', 'string', 'max:255'],
            'address.line2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['required', 'string', 'max:255'],
            'address.state' => ['nullable', 'string', 'max:255'],
            'address.postal_code' => ['nullable', 'string', 'max:20'],
            'address.country_code' => ['required', 'string', 'size:2'],
        ];
    }
}
