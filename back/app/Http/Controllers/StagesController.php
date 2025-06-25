<?php

namespace App\Http\Controllers;

use App\Models\Stage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StagesController extends Controller
{
    // Obtener todas las Fases
    public function getFase(): JsonResponse
    {
        $Fases = Stage::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('stages as a2')
                    ->whereColumn('a2.reference_id', 'stages.reference_id');
            })
            ->get();

        return response()->json($Fases, 200);
    }

    // Crear una nueva Fase
    public function newFase(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'description' => 'required|string',
            'phase_type' => 'required|string',
            'repeat' => 'boolean',
            'repeat_line' => 'boolean',
            'repeat_minutes' => 'nullable|integer',
            'alert' => 'boolean',
            'can_pause' => 'boolean',
            'status' => 'boolean',
            'multi' => 'boolean',
            'activities' => 'nullable|array',
            'duration' => 'nullable|string',
            'duration_user' => 'nullable|string',
            'user' => 'string|nullable',
        ]);

        // Normalizar activities (por ejemplo, convertir a enteros)
        if (isset($validatedData['activities']) && is_array($validatedData['activities'])) {
            $validatedData['activities'] = array_values(
                array_map(fn($item) => intval($item), $validatedData['activities'])
            );
        }

        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();

        // Crear la nueva Fase
        $Fase = Stage::create($validatedData);

        return response()->json([
            'message' => 'Fase creada exitosamente',
            'Fase' => $Fase
        ], 201);
    }


    // Obtener una Fase por ID
    public function FaseId($id): JsonResponse
    {
        $Fase = Stage::find($id);
        if (!$Fase) {
            return response()->json(['message' => 'Fase no encontrada'], 404);
        }
        return response()->json($Fase);
    }

    // Actualizar una Fase
    public function updateFase(Request $request, $id): JsonResponse
    {
        $Fase = Stage::find($id);
        if (!$Fase) {
            return response()->json(['message' => 'Fase no encontrada'], 404);
        }

        $validatedData = $request->validate([
            'description' => 'required|string',
            'phase_type' => 'required|string',
            'repeat' => 'boolean',
            'repeat_line' => 'boolean',
            'repeat_minutes' => 'nullable|integer',
            'alert' => 'boolean',
            'can_pause' => 'boolean',
            'status' => 'boolean',
            'multi' => 'boolean',
            'activities' => 'required|array',
            'duration' => 'nullable|string',
            'duration_user' => 'nullable|string',
            'user' => 'string|nullable',
        ]);
        // Desactivar la versión anterior
        $Fase->active = false;
        $Fase->save();
        // Normalizar activities (por ejemplo, convertir a enteros)
        if (isset($validatedData['activities']) && is_array($validatedData['activities'])) {
            $validatedData['activities'] = array_values(
                array_map(fn($item) => intval($item), $validatedData['activities'])
            );
        };
        // Crear nueva versión
        $newVersion = (int) $Fase->version + 1;
        $newFase = $Fase->replicate(); // duplica todos los atributos excepto la PK
        $newFase->version = $newVersion;
        $newFase->fill($validatedData);
        $newFase->reference_id = $Fase->reference_id ?? (string) Str::uuid();
        $newFase->active = true; // activamos la nueva versión
        $newFase->save();

        return response()->json([
            'message' => 'Fase actualizada como nueva versión correctamente',
            'Fase' => $newFase
        ]);
    }

    // Eliminar una Fase
    public function deleteFase($id): JsonResponse
    {
        $Fase = Stage::find($id);
        if (!$Fase) {
            return response()->json(['message' => 'Fase no encontrada'], 404);
        }

        $Fase->active = false;
        $Fase->save();

        return response()->json(['message' => 'Fase eliminada correctamente']);
    }
}