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
        Schema::create('maestras', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->text('descripcion');
            $table->boolean('requiere_bom')->default(false);
            $table->string('type_product')->nullable(); 
            $table->unsignedBigInteger('type_acondicinamiento')->nullable();
            $table->json('type_stage')->nullable();
            $table->string('status_type')->default('En creación');
            $table->boolean('aprobado')->default(false);
            $table->boolean('paralelo')->default(false);
            $table->string('duration')->nullable();
            $table->string('duration_user')->nullable();
            $table->foreign('type_acondicinamiento')->references('id')->on('tipo_acondicionamientos')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maestras');
    }
};