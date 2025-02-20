<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;


class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'crear_usuarios', 'description' => 'Crear Usuarios'],
            ['name' => 'gestionar_roles', 'description' => 'Gestionar Roles'],
            ['name' => 'ver_reportes', 'description' => 'Ver Reportes'],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(
                ['name' => $perm['name']],
                ['description' => $perm['description'], 'status' => true]
            );
        }

        // Asignar permisos por defecto a roles
        $roles = [
            'admin' => ['crear_usuarios', 'gestionar_roles', 'ver_reportes'],
            'gerente' => ['gestionar_roles', 'ver_reportes'],
        ];

        foreach ($roles as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            foreach ($permissions as $permission) {
                $perm = Permission::where('name', $permission)->first();
                if ($perm) {
                    $role->givePermissionTo($perm);
                }
            }
        }
    }
}