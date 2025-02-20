<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function getPermisos()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();

        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions
        ]);
    }

        public function updateRolePermissions(Request $request, $roleId)
        {
            $role = Role::findOrFail($roleId);
            $role->syncPermissions($request->permissions);
            return response()->json(['message' => 'Permisos actualizados']);
        }
}