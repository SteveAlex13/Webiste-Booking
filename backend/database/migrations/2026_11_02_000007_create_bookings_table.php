<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('room_type_id')->constrained('room_types')->onDelete('cascade');
            $table->foreignId('assigned_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->string('customer_name', 100);
            $table->string('customer_email', 150);
            $table->string('customer_phone', 30);
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->unsignedSmallInteger('total_nights')->default(1);
            $table->unsignedTinyInteger('total_adults')->default(1);
            $table->unsignedTinyInteger('total_children')->default(0);
            $table->decimal('room_price_per_night', 15, 2);
            $table->decimal('total_room_amount', 15, 2);
            $table->decimal('total_extras_amount', 15, 2)->default(0);
            $table->decimal('tax_and_service_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->text('special_requests')->nullable();
            $table->string('status', 30)->default('PENDING_PAYMENT');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('checked_out_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['check_in_date', 'check_out_date', 'status']);
            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

