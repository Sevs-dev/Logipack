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
        Schema::create('form_controls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ejecutada_id');
            $table->unsignedBigInteger('stage_id');
            $table->unsignedBigInteger('activity_id');
            $table->string('description');
            $table->json('types')->nullable();
            $table->foreign('ejecutada_id')->references('id')->on('actividades_ejecutadas')->onDelete('cascade');
            $table->foreign('stage_id')->references('id')->on('stages')->onDelete('cascade');
            $table->foreign('activity_id')->references('id')->on('activities')->onDelete('cascade');
            $table->string('user');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_controls');
    }
};