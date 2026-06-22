<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CartItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property-read int $id
 * @property int $cart_id
 * @property int $product_id
 * @property int $quantity
 * @property int $unit_price_cents
 * @property-read Carbon $created_at
 * @property-read Carbon $updated_at
 * @property-read Cart $cart
 * @property-read Product $product
 * @property-read int $subtotal_cents
 */
class CartItem extends Model
{
    /** @use HasFactory<CartItemFactory> */
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
        'unit_price_cents',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price_cents' => 'integer',
        ];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getSubtotalCentsAttribute(): int
    {
        return $this->quantity * $this->unit_price_cents;
    }
}
