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
            $table->string('codigo')->nullable(); // Concatena los datos de los id
            $table->string('valor')->nullable(); 

            // Campos de la tabla 'adaptations' (o relacionados)
            $table->unsignedBigInteger('id_adaptation')->nullable();
            $table->string('adaptation_number_order')->nullable(); 

            // Campos de la tabla 'muestras' (o relacionados)
            $table->unsignedBigInteger('id_muestra')->nullable();
            $table->text('muestra_descripcion')->nullable();
            $table->longText('muestra_fk_stages')->nullable();

            // Campos de la tabla 'stages' (o relacionados)
            $table->unsignedBigInteger('id_stage')->nullable();
            $table->string('stage_descripcion')->nullable();
            $table->string('stage_phase_type')->nullable();
            $table->boolean('stage_status')->nullable(); 
            $table->longText('stage_fk_activities')->nullable();

            // Campos de la tabla 'activities' (o relacionados)
            $table->unsignedBigInteger('id_activitie')->nullable(); 
            $table->string('activitie_descripcion')->nullable();
            $table->longText('activitie_config')->nullable();
            $table->boolean('activitie_binding')->nullable();
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
