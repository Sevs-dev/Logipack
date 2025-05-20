<?php

namespace App\Http\Controllers;

use App\Models\Stage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StagesController extends Controller
{
    // Obtener todas las Fases
    public function getFase(): JsonResponse
    {
        $Fases = Stage::all();
        return response()->json($Fases);
    }

    // Crear una nueva Fase
    public function newFase(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'description' => 'required|string',
            'phase_type' => 'required|string',
            'repeat' => 'boolean',
            'repeat_minutes' => 'nullable|integer',
            'alert' => 'boolean',
            'can_pause' => 'boolean',
            'status' => 'boolean',
            'multi' => 'boolean',
            'activities' => 'required|json',
            'duration' => 'nullable',
            'duration_user' => 'nullable',
        ]);

        // Generar código autoincremental manualmente
        $lastCode = Stage::max('code') ?? 0;
        $validatedData['code'] = $lastCode + 1;

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
            'phase_type' => 'required|string ',
            'repeat' => 'boolean',
            'repeat_minutes' => 'nullable|integer',
            'alert' => 'boolean',
            'can_pause' => 'boolean',
            'status' => 'boolean',
            'multi' => 'boolean',
            'activities' => 'required|json',
            'duration' => 'nullable',
            'duration_user' => 'nullable',
        ]);

        $Fase->update($validatedData);

        return response()->json([
            'message' => 'Fase actualizada correctamente',
            'Fase' => $Fase
        ]);
    }

    // Eliminar una Fase
    public function deleteFase($id): JsonResponse
    {
        $Fase = Stage::find($id);
        if (!$Fase) {
            return response()->json(['message' => 'Fase no encontrada'], 404);
        }

        $Fase->delete();

        return response()->json(['message' => 'Fase eliminada correctamente']);
    }
}