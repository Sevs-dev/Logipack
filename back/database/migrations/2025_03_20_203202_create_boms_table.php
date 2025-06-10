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
        Schema::create('boms', function (Blueprint $table) {
            $table->id(); 
            $table->unsignedBigInteger('client_id');
            $table->string('base_quantity')->nullable();
            $table->string('details')->nullable(); 
            $table->string('code_details')->nullable(); 
            $table->boolean('status')->default(false);
            $table->json('ingredients')->nullable();
            $table->json('code_ingredients')->nullable(); 
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
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
        Schema::dropIfExists('boms');
    }
};