<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('actividades_controls', function (Blueprint $table) {
            $table->id();
            $table->string('adaptation_date_id')->nullable();
            $table->string('fase_id')->nullable();
            $table->string('descripcion')->nullable();
            $table->string('activities')->nullable();
            $table->string('phase_type')->nullable();
            $table->json('forms')->nullable();
            $table->string('user')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividades_controls');
    }
};
