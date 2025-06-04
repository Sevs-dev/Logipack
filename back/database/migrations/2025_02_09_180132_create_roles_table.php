<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Insertar los roles directamente en la migración
        $roles = [
            'Administrador',
            'J_Calidad',
            'Calidad',
            'Operativo',
            'Coordinador',
            'Consulta',
            'Visitante'
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert(['name' => $role, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};