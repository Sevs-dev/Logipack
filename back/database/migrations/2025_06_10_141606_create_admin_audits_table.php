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
        Schema::create('admin_audits', function (Blueprint $table) {
            $table->id();
            $table->string('user')->nullable(); // Usuario que hizo el cambio
            $table->string('action'); // create, update, delete
            $table->string('auditable_type'); // Modelo: App\Models\Activity, etc.
            $table->unsignedBigInteger('auditable_id'); // ID del modelo

            $table->uuid('reference_id')->nullable()->index(); // Agrupador lógico por UUID
            $table->integer('version')->default(1)->index(); // Versión del cambio

            $table->json('old_values')->nullable(); // Valores antes del cambio
            $table->json('new_values')->nullable(); // Valores después del cambio 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_audits');
    }
};