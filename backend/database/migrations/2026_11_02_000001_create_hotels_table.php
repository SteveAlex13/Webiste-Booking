<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('tagline', 255)->nullable();
            $table->unsignedTinyInteger('star_rating')->default(5);
            $table->text('address');
            $table->string('city', 100);
            $table->string('phone', 30);
            $table->string('email', 100);
            $table->string('check_in_time', 10)->default('14:00');
            $table->string('check_out_time', 10)->default('12:00');
            $table->text('description')->nullable();
            $table->string('image', 255)->nullable();
            $table->json('policies')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};

