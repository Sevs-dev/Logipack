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
        Schema::table('adaptation_dates', function (Blueprint $table) {
            $table->timestamp('order_time')->nullable()->after('user'); 
            $table->string('planning_user')->nullable()->after('order_time'); 
            $table->timestamp('planning_time')->nullable()->after('planning_user'); 
        });
    }
    public function down(): void
    {
        Schema::table('adaptation_dates', function (Blueprint $table) {
            $table->dropColumn('planning_user', 'planning_time', 'order_time');
        });
    }
};
