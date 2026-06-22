<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CartFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property-read int $id
 * @property-read string $uuid
 * @property int|null $user_id
 * @property string|null $session_id
 * @property Carbon|null $expires_at
 * @property-read Carbon $created_at
 * @property-read Carbon $updated_at
 * @property-read Collection<CartItem> $items
 * @property-read User|null $user
 * @property-read int $total_cents
 * @property-read int $item_count
 */
class Cart extends Model
{
    /** @use HasFactory<CartFactory> */
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'uuid',
        'user_id',
        'session_id',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getTotalCentsAttribute(): int
    {
        return (int) $this->items->sum(fn (CartItem $item): int => $item->subtotal_cents);
    }

    public function getItemCountAttribute(): int
    {
        return (int) $this->items->sum('quantity');
    }
}
