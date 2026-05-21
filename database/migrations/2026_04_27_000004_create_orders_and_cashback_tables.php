<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('total_amount', 15, 2);
            $table->string('status')->default('pending'); // pending, approved, rejected, completed
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained();
            $table->decimal('price', 15, 2);
            $table->decimal('weight', 8, 3);
            $table->timestamps();
        });

        Schema::create('cashback_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained();
            $table->decimal('total_product_value', 15, 2);
            $table->decimal('daily_amount', 15, 2); // 1% of value
            $table->decimal('paid_amount', 15, 2)->default(0.00);
            $table->integer('days_paid')->default(0);
            $table->enum('status', ['active', 'paused', 'completed'])->default('active');
            $table->timestamp('last_paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashback_cycles');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
