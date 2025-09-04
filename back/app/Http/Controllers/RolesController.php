<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class RolesController extends Controller
{
    // Método para obtener todos los registros de Role y devolverlos en formato JSON
    public function getRole(): JsonResponse
    {
        $roles = Role::where('active', true)
            ->whereRaw("LOWER(TRIM(name)) <> 'master'")
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('roles as a2')
                    ->whereColumn('a2.reference_id', 'roles.reference_id');
            })
            ->get();
        return response()->json($roles, 200);
    }

    // Método para crear un nuevo Role
    public function newRole(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255|unique:roles,name',
            'user'      => 'nullable|string',
            'active'    => 'sometimes|boolean',
            'can_edit'  => 'sometimes|boolean',
            'can_view'  => 'sometimes|boolean',
        ]);

        // Prepara datos completos para INSERT
        $roleData = [
            'name'         => $data['name'],
            'version'      => 1, // si tu migración tiene default(1), puedes omitir esta línea
            'active'       => $data['active'] ?? true,
            'can_edit'     => $data['can_edit'] ?? false,
            'can_view'     => $data['can_view'] ?? false,
            'reference_id' => (string) Str::uuid(),
            'user'         => $data['user'],
        ];

        try {
            $role = Role::create($roleData);

            return response()->json([
                'message' => 'Rol creado exitosamente',
                'Role'    => $role,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('💥 Error creando rol', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'No se pudo crear el rol',
            ], 500);
        }
    }

    // Método para obtener un Role específico por su ID
    public function RoleId($id): JsonResponse
    {
        // Se busca el Role por el ID proporcionado
        $Role = Role::find($id);

        // Si no se encuentra, se devuelve un mensaje de error con código 404 (No Encontrado)
        if (!$Role) {
            return response()->json(['message' => 'Role no encontrada'], 404);
        }

        // Si se encuentra, se devuelve el Role en formato JSON
        return response()->json($Role);
    }

    // Método para actualizar un Role existente
    public function updateRole(Request $request, $id): JsonResponse
    {
        // Se busca el Role por el ID proporcionado
        $Role = Role::find($id);

        if (!$Role) {
            return response()->json(['message' => 'Role no encontrado'], 404);
        }

        // Validar campos
        $validatedData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'user' => 'string|nullable',
            'can_edit' => 'sometimes|boolean',
            'can_view' => 'sometimes|boolean',
        ]);

        // Desactivar la versión anterior
        $Role->active = false;
        $Role->save();

        // Crear nueva versión
        $newVersion = (int) $Role->version + 1;

        $new = $Role->replicate();
        $new->version = $newVersion;
        $new->fill($validatedData);
        $new->reference_id = $Role->reference_id ?? (string) Str::uuid();
        $new->active = true;
        $new->user = $Role->user;
        if (array_key_exists('can_edit', $validatedData)) {
            $new->can_edit = (bool) $validatedData['can_edit'];
        }
        if (array_key_exists('can_view', $validatedData)) {
            $new->can_view = (bool) $validatedData['can_view'];
        }
        if (array_key_exists('user', $validatedData)) {
            $new->user = $validatedData['user'];
        }

        $new->save();

        return response()->json([
            'message' => 'Role actualizada correctamente',
            'Role' => $new
        ]);
    }

    // Método para eliminar un Role por su ID
    public function deleteRole($id): JsonResponse
    {
        // Se busca el Role por el ID proporcionado
        $Role = Role::find($id);

        if (!$Role) {
            return response()->json(['message' => 'Role no encontrada'], 404);
        }

        $Role->active = false;
        $Role->save();

        return response()->json(['message' => 'Role eliminada correctamente']);
    }
}
