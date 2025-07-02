<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('timer_controls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('timer_id');
            $table->string('user');
            $table->json('data'); // Aquí va el array de actividades como JSON
            $table->timestamps();
            $table->foreign('timer_id')->references('id')->on('timers')->onDelete('cascade'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timer_controls');
    }
};