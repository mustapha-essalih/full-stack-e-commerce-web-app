<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('stripe_payment_intent_id')->unique();
            $table->bigInteger('amount_cents');
            $table->string('currency', 3)->default('usd');
            $table->string('status')->default('pending')->index();
            $table->string('stripe_charge_id')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('stripe_payment_intent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
