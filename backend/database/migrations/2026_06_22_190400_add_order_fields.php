<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->jsonb('shipping_address')->nullable()->after('notes');
            $table->jsonb('billing_address')->nullable()->after('shipping_address');
            $table->timestamp('shipped_at')->nullable()->after('cancelled_at');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
            $table->timestamp('processing_at')->nullable()->after('delivered_at');
            $table->string('stripe_payment_intent_id')->nullable()->after('delivered_at');
            $table->unsignedBigInteger('coupon_id')->nullable()->after('stripe_payment_intent_id');
            $table->string('tracking_number')->nullable()->after('coupon_id');

            $table->index('coupon_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn([
                'shipping_address',
                'billing_address',
                'shipped_at',
                'delivered_at',
                'processing_at',
                'stripe_payment_intent_id',
                'coupon_id',
                'tracking_number',
            ]);
        });
    }
};
