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
        Schema::create('manufacturings', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nombre de la línea de producción
            $table->json('products')->nullable(); // Tipos de líneas de producción en formato JSON
            $table->foreignId('factory_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manufacturings');
    }
};