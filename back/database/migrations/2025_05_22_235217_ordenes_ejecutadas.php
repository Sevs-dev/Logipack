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
        Schema::create('ordenes_ejecutadas', function (Blueprint $table) {
            $table->id();
            $table->string('adaptation_date_id')->nullable();
            $table->string('adaptation_id')->nullable(); // Concatena los datos de los id
            $table->string('maestra_id')->nullable();
            $table->string('number_order')->nullable();
            $table->string('orderType');
            $table->string('descripcion_maestra')->nullable();
            $table->boolean('requiere_bom');
            $table->string('maestra_fases_fk')->nullable();
            // $table->string('maestra_tipo_acondicionamiento_fk')->nullable();
            $table->string('linea_produccion')->nullable();
            $table->string('cliente')->nullable();
            $table->string('planta')->nullable();
            $table->integer('cantidad_producir')->nullable()->default(0);
            $table->string('proceso')->nullable()->default('eject');
            $table->string('estado')->nullable()->default('100');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ordenes_ejecutadas');
    }
};
