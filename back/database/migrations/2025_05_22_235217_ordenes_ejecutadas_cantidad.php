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
        Schema::table('ordenes_ejecutadas', function (Blueprint $table) {
            $table->integer('cantidad_producir')->after('planta')->nullable()->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ordenes_ejecutadas', function (Blueprint $table) {
            $table->dropColumn('cantidad_producir');
        });
    }
};
