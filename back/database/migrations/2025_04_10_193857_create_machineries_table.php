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
        Schema::create('machineries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factory_id')->constrained()->onDelete('cascade'); // Relación con la planta
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('type')->nullable();
            $table->string('power')->nullable();
            $table->string('capacity')->nullable();
            $table->string('dimensions')->nullable();
            $table->string('weight')->nullable();
            $table->boolean('is_mobile')->default(false);
            $table->string('description')->nullable();
            $table->string('version'); // Guarda el tiempo en formato HH:MM:SS
            $table->boolean('active')->default(true); // Indica si tiene 
            $table->uuid('reference_id');
            $table->string('user');
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machineries');
    }
};