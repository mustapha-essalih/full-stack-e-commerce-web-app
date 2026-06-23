<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

/**
 * @property-read int $id
 * @property-read string $uuid
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string|null $short_description
 * @property int $price_cents
 * @property int|null $compare_price_cents
 * @property string $sku
 * @property int $stock_quantity
 * @property bool $is_active
 * @property bool $is_featured
 * @property int|null $weight_grams
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property-read Carbon $created_at
 * @property-read Carbon $updated_at
 * @property-read Carbon|null $deleted_at
 * @property-read Collection<Category> $categories
 * @property-read Collection<ProductImage> $images
 * @property-read string $price_formatted
 * @property-read string|null $compare_price_formatted
 *
 * @method static Builder<Product> active()
 * @method static Builder<Product> featured()
 * @method static Builder<Product> inStock()
 */
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'description',
        'short_description',
        'price_cents',
        'compare_price_cents',
        'sku',
        'stock_quantity',
        'is_active',
        'is_featured',
        'weight_grams',
        'meta_title',
        'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'compare_price_cents' => 'integer',
            'stock_quantity' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'weight_grams' => 'integer',
        ];
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true)->orderBy('sort_order');
    }

    public function inventoryAdjustments(): HasMany
    {
        return $this->hasMany(InventoryAdjustment::class);
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        $image = $this->relationLoaded('primaryImage') && $this->primaryImage
            ? $this->primaryImage
            : $this->images->first();

        if (!$image) {
            return null;
        }

        return 'storage/' . $image->path;
    }

    public function getPriceFormattedAttribute(): string
    {
        return '$' . number_format($this->price_cents / 100, 2);
    }

    public function getComparePriceFormattedAttribute(): ?string
    {
        if ($this->compare_price_cents === null) {
            return null;
        }

        return '$' . number_format($this->compare_price_cents / 100, 2);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('stock_quantity', '>', 0);
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product): void {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }
}
