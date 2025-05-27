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
        Schema::create('adaptations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('factory_id');
            $table->unsignedBigInteger('master');
            $table->unsignedBigInteger('bom')->nullable();
            $table->json('article_code');
            $table->string('attachment')->nullable();
            $table->string('number_order')->nullable();  
            $table->json('ingredients')->nullable();
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('factory_id')->references('id')->on('factories')->onDelete('cascade');
            $table->foreign('master')->references('id')->on('maestras')->onDelete('cascade');
            $table->foreign('bom')->references('id')->on('boms')->onDelete('cascade');
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adaptations');
    }
};