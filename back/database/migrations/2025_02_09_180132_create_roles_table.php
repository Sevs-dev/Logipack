<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
             $table->boolean('can_edit')->default(true);
             $table->boolean('can_view')->default(true);
            $table->string('version')->default(1); // Guarda el tiempo en formato HH:MM:SS
            $table->boolean('active')->default(true); // Indica si tiene 
            $table->uuid('reference_id');
            $table->string('user')->default('system');;
            $table->timestamps();
        });

        // Insertar los roles directamente en la migración
        $roles = [
            'Master',
            'Administrador',
            'Jefe de Calidad',
            'Calidad',
            'Operativo',
            'Coordinador',
            'Consulta',
            'Visitante'
        ];

        $now = now();
        foreach ($roles as $role) {
            DB::table('roles')->insert([
                'name'         => $role, 
                'can_edit'       => false,
                'can_view'       => false,
                'active'       => true,
                'reference_id' => (string) Str::uuid(),
                'user'         => 'system',
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};