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
        Schema::create('stages', function (Blueprint $table) {
            $table->id();
            $table->integer('code')->unique(); // Código autoincrementado manualmente
            $table->string('description'); // Descripción de la fase
            $table->enum('phase_type', ['Planeacion', 'Conciliación', 'Control', 'Actividades']); // Tipo de fase
            $table->json('activities')->nullable();
            $table->boolean('repeat')->default(false); // Indica si se repite
            $table->integer('repeat_minutes')->nullable(); // Minutos entre repeticiones
            $table->boolean('alert')->default(false); // Indica si tiene alerta
            $table->boolean('can_pause')->default(false); // Indica si se puede pausar
            $table->boolean('status')->default(false); // Indica si se puede pausar
            $table->string('duration')->nullable();
            $table->string('duration_user')->nullable();
            $table->timestamps(); // Fechas de creación y actualización
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stages');
    }
};