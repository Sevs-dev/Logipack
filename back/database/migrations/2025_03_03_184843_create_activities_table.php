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
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->integer('code')->unique(); // Código autoincrementado manualmente
            $table->string('description'); // Descripción de la fase
            $table->json('config')->nullable(); // Almacena tipo y opciones en JSON
            $table->boolean('binding')->default(false); // Indica si tiene 
            $table->boolean('has_time')->default(false); // Indica si requiere tiempo
            $table->string('duration')->nullable(); // Guarda el tiempo en formato HH:MM:SS
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};