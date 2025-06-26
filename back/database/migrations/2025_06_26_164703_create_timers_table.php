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
        Schema::create('timers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ejecutada_id');
            $table->unsignedBigInteger('stage_id');
            $table->unsignedBigInteger('control_id')->nullable();
            $table->string('orden_id');
            $table->unsignedInteger('time')->default(0);
            $table->string('status', 50)->default('0');
            $table->boolean('pause')->default(false);
            $table->unsignedInteger('pause_time')->default(0);
            $table->boolean('finish')->default(false);
            $table->timestamps();
            $table->foreign('ejecutada_id')->references('id')->on('actividades_ejecutadas')->onDelete('cascade'); 
            $table->foreign('stage_id')->references('id')->on('stages')->onDelete('cascade');
            $table->foreign('control_id')->references('id')->on('stages')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timers');
    }
};