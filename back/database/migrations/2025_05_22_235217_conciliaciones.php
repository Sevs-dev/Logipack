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
        Schema::create('conciliaciones', function (Blueprint $table) {
            $table->id();
            $table->string('orden_ejecutada')->nullable();
            $table->string('adaptation_date_id')->nullable();
            $table->string('number_order')->nullable();
            $table->string('descripcion_maestra')->nullable();

            // articulos a conciliar
            $table->string('codart')->nullable();
            $table->string('desart')->nullable();
            $table->double('quantityToProduce')->nullable();  // (a)
            $table->double('faltante')->nullable(); // (b)
            $table->double('adicionales')->nullable(); // (c)
            $table->double('rechazo')->nullable(); // (d)
            $table->double('danno_proceso')->nullable(); // (e)
            $table->double('devolucion')->nullable(); // (f)
            $table->double('sobrante')->nullable(); // (g)
            $table->double('total')->nullable(); // =a + c + g - (b + d + e + f)
            $table->double('rendimiento')->nullable(); // =h - e / ( a - (d + b) ) * 100
            $table->double('unidades_caja')->nullable();
            $table->double('numero_caja')->nullable();
            $table->double('unidades_saldo')->nullable();
            $table->double('total_saldo')->nullable();

            // Obtener usuario
            $table->string('user')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conciliaciones');
    }
};