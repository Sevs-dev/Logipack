<?php

/*
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::create('fases_ejecutadas', function (Blueprint $table) {
            $table->id();
            $table->string('orden_ejecutada')->nullable();
            $table->string('adaptation_date_id')->nullable();
            $table->string('adaptation_id')->nullable();
            $table->string('fases_fk')->nullable();
            $table->string('description_fase')->nullable();
            $table->string('phase_type')->nullable();
            $table->string('linea')->nullable();
            $table->string('repeat_line')->nullable()->default(0);
            $table->json('estado')->nullable()->default(false);
            // $table->string('user')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fases_ejecutadas');
    }
};
*/
