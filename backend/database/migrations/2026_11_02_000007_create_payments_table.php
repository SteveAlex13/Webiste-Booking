<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->string('order_id', 100)->unique();
            $table->string('transaction_id', 100)->nullable();
            $table->text('snap_token')->nullable();
            $table->string('payment_type', 50)->nullable();
            $table->decimal('gross_amount', 15, 2);
            $table->string('status', 30)->default('PENDING');
            $table->string('provider_status', 50)->nullable();
            $table->string('fraud_status', 30)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->json('provider_response')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

