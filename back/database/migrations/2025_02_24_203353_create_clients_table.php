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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name'); 
            $table->string('code'); 
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('job_position')->nullable();
            $table->json('responsible_person')->nullable();
            $table->string('version'); // Guarda el tiempo en formato HH:MM:SS
            $table->boolean('active')->default(true); // Indica si tiene 
            $table->uuid('reference_id');
            $table->string('user');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};