<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::create([
            'name' => 'Electronics',
            'slug' => 'electronics',
            'description' => 'Electronic devices and accessories',
            'sort_order' => 1,
        ]);

        $clothing = Category::create([
            'name' => 'Clothing',
            'slug' => 'clothing',
            'description' => 'Apparel and fashion items',
            'sort_order' => 2,
        ]);

        $home = Category::create([
            'name' => 'Home & Garden',
            'slug' => 'home-garden',
            'description' => 'Home improvement and garden supplies',
            'sort_order' => 3,
        ]);

        $phones = Category::create([
            'name' => 'Phones',
            'slug' => 'phones',
            'description' => 'Mobile phones and accessories',
            'parent_id' => $electronics->id,
            'sort_order' => 1,
        ]);

        $laptops = Category::create([
            'name' => 'Laptops',
            'slug' => 'laptops',
            'description' => 'Notebooks and laptops',
            'parent_id' => $electronics->id,
            'sort_order' => 2,
        ]);

        $men = Category::create([
            'name' => "Men's Clothing",
            'slug' => 'mens-clothing',
            'description' => "Men's apparel",
            'parent_id' => $clothing->id,
            'sort_order' => 1,
        ]);

        $women = Category::create([
            'name' => "Women's Clothing",
            'slug' => 'womens-clothing',
            'description' => "Women's apparel",
            'parent_id' => $clothing->id,
            'sort_order' => 2,
        ]);

        $product1 = Product::create([
            'name' => 'Wireless Bluetooth Headphones',
            'slug' => 'wireless-bluetooth-headphones',
            'description' => 'Premium wireless headphones with noise cancellation, 30-hour battery life, and comfortable over-ear design.',
            'short_description' => 'Premium noise-cancelling wireless headphones',
            'price_cents' => 14999,
            'compare_price_cents' => 19999,
            'sku' => 'WH-1000XM5',
            'stock_quantity' => 25,
            'is_featured' => true,
            'weight_grams' => 250,
        ]);

        $product2 = Product::create([
            'name' => 'Slim Fit Cotton T-Shirt',
            'slug' => 'slim-fit-cotton-tshirt',
            'description' => 'Comfortable 100% organic cotton t-shirt with a modern slim fit. Available in multiple colors.',
            'short_description' => 'Organic cotton slim fit t-shirt',
            'price_cents' => 2999,
            'compare_price_cents' => 3999,
            'sku' => 'TS-SLIM-001',
            'stock_quantity' => 100,
            'weight_grams' => 150,
        ]);

        $product3 = Product::create([
            'name' => 'Smartphone 128GB',
            'slug' => 'smartphone-128gb',
            'description' => 'Latest generation smartphone with 128GB storage, 48MP camera, and 6.5" AMOLED display.',
            'short_description' => '128GB smartphone with AMOLED display',
            'price_cents' => 69999,
            'sku' => 'SP-128-2024',
            'stock_quantity' => 10,
            'is_featured' => true,
            'weight_grams' => 200,
        ]);

        $product4 = Product::create([
            'name' => 'Ultrabook Pro 15"',
            'slug' => 'ultrabook-pro-15',
            'description' => 'Powerful ultrabook with 15.6" 4K display, 16GB RAM, 512GB SSD, and latest-gen processor.',
            'short_description' => '15.6" 4K ultrabook, 16GB RAM, 512GB SSD',
            'price_cents' => 129999,
            'compare_price_cents' => 149999,
            'sku' => 'UB-PRO-15-001',
            'stock_quantity' => 5,
            'is_featured' => true,
            'weight_grams' => 1800,
        ]);

        $product5 = Product::create([
            'name' => 'Ceramic Plant Pot Set',
            'slug' => 'ceramic-plant-pot-set',
            'description' => 'Set of 3 handcrafted ceramic plant pots with drainage holes. Perfect for indoor plants.',
            'short_description' => 'Set of 3 handcrafted ceramic pots',
            'price_cents' => 4999,
            'sku' => 'CP-SET-001',
            'stock_quantity' => 30,
            'weight_grams' => 2000,
        ]);

        $product1->categories()->attach([$electronics->id, $phones->id]);
        $product2->categories()->attach([$clothing->id, $men->id, $women->id]);
        $product3->categories()->attach([$electronics->id, $phones->id]);
        $product4->categories()->attach([$electronics->id, $laptops->id]);
        $product5->categories()->attach([$home->id]);
    }
}
