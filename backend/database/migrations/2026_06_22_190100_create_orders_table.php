<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('draft');
            $table->bigInteger('subtotal_cents')->default(0);
            $table->bigInteger('tax_cents')->default(0);
            $table->bigInteger('shipping_cents')->default(0);
            $table->bigInteger('discount_cents')->default(0);
            $table->bigInteger('total_cents')->default(0);
            $table->string('currency', 3)->default('usd');
            $table->text('notes')->nullable();
            $table->string('coupon_code')->nullable();
            $table->foreignId('billing_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->foreignId('shipping_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
