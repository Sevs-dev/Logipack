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
        Schema::create('actividades_ejecutadas', function (Blueprint $table) {
            $table->id();
            $table->string('orden_id')->nullable();
            $table->string('adaptation_id')->nullable(); // Concatena los datos de los id
            $table->string('number_order')->nullable();
            $table->string('tipo_acondicionamiento_fk')->nullable();
            $table->string('fases_fk')->nullable();
            $table->string('datos_forms')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividades_ejecutadas');
    }
};
