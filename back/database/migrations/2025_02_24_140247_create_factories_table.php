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
        Schema::create('factories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nombre de la planta
            $table->string('location'); // Ubicación de la planta
            $table->string('capacity')->nullable(); // Capacidad de producción
            $table->string('manager')->nullable(); // Nombre del gerente
            $table->string('employees')->nullable(); // Número de empleados
            $table->boolean('status')->default(true); // Estado de la planta
            $table->string('prefix')->nullable(); // Estado de la planta
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
        Schema::dropIfExists('factories');
    }
};