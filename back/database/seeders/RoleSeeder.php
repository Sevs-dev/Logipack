<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear roles
        $roles = [
            'admin',
            'gerente',
            'coordinador',
            'supervisor',
            'tecnico',
            'operario',
            'moderador',
            'externo'
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // Crear permisos
        $permissions = [
            ['name' => 'crear_usuarios', 'description' => 'Crear Usuarios'],
            ['name' => 'editar_usuarios', 'description' => 'Editar Usuarios'],
            ['name' => 'eliminar_usuarios', 'description' => 'Eliminar Usuarios'],
            ['name' => 'ver_reportes', 'description' => 'Ver Reportes']
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate([
                'name' => $perm['name'],
                'description' => $perm['description']
            ]);
        }

        // Asignar permisos a roles
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->permissions()->sync(Permission::pluck('id')->toArray()); // Admin tiene todos los permisos
        }

        $gerente = Role::where('name', 'gerente')->first();
        if ($gerente) {
            $gerente->permissions()->sync(Permission::whereIn('name', ['ver_reportes'])->pluck('id')->toArray());
        }
    }
}