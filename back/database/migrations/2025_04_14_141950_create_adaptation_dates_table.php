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
        Schema::create('adaptation_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients');
            $table->foreignId('factory_id')->constrained('factories'); 

            // Los campos que vienen dentro de cada article_code
            $table->string('number_order')->nullable();
            $table->string('codart');
            $table->string('orderNumber');
            $table->date('deliveryDate');
            $table->integer('quantityToProduce');
            $table->string('lot');
            $table->string('healthRegistration');

            // Lo demás
            $table->json('master');
            $table->json('bom')->nullable();
            $table->json('ingredients')->nullable();
            $table->foreignId('adaptation_id')->nullable()->constrained('adaptations');
            $table->string('status_dates')->default("En Creación");
            $table->string('factory')->nullable();
            $table->string('line')->nullable();
            $table->string('resource')->nullable();
            $table->string('machine')->nullable();
            $table->string('color')->nullable();
            $table->string('icon')->nullable();
            $table->string('duration')->nullable();
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adaptation_dates');
    }
};