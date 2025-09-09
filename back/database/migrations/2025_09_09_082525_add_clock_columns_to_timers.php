<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timers', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('time');
            $table->timestamp('paused_at')->nullable()->after('started_at');
            $table->unsignedInteger('accumulated_pause_secs')->default(0)->after('paused_at');
            $table->timestamp('finished_at')->nullable()->after('finish');
        });
    }
    public function down(): void
    {
        Schema::table('timers', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'paused_at', 'accumulated_pause_secs', 'finished_at']);
        });
    }
};
