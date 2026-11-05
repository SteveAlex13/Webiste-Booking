<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->onDelete('cascade');
            $table->string('name', 150);
            $table->string('slug', 180)->unique();
            $table->text('description')->nullable();
            $table->decimal('base_price_per_night', 15, 2);
            $table->decimal('weekend_price_per_night', 15, 2)->nullable();
            $table->unsignedTinyInteger('max_adults')->default(2);
            $table->unsignedTinyInteger('max_children')->default(1);
            $table->unsignedSmallInteger('room_size_sqm')->default(32);
            $table->string('bed_type', 100)->default('1 King Bed');
            $table->unsignedInteger('total_rooms')->default(5);
            $table->boolean('is_active')->default(true);
            $table->string('featured_image', 255)->nullable();
            $table->json('gallery_images')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_types');
    }
};

