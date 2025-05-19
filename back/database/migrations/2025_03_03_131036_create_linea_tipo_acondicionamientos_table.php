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
        Schema::create('linea_tipo_acondicionamientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tipo_acondicionamiento_id')
                  ->constrained('tipo_acondicionamientos')
                  ->onDelete('cascade');
            $table->integer('orden');
            $table->text('descripcion');
            $table->string('fase');
            $table->boolean('editable')->default(false);
            $table->boolean('control')->default(false);
            $table->string('fase_control')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linea_tipo_acondicionamientos');
    }
}; 