<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Manufacturing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManufacturingController extends Controller
{
    // Obtener todas las fábricas
    public function getManu(): JsonResponse
    {
        $Manu = Manufacturing::all();
        return response()->json($Manu);
    }

    public function newManu(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'products' => 'required|array',
            'factory_id' => 'required|exists:factories,id',
        ]);

        // Guardamos correctamente el name y el JSON
        $Manu = Manufacturing::create([
            'name' => $request->name,
            'products' => $request->has('products') ? json_encode($request->products) : json_encode([]),
            'factory_id' => $request->factory_id
        ]);

        return response()->json([
            'message' => 'Línea creada exitosamente',
            'Manu' => $Manu
        ], 201);
    }

    // Obtener una fábrica por ID
    public function ManuId($id): JsonResponse
    {
        $Manu = Manufacturing::find($id);
        if (!$Manu) {
            return response()->json(['message' => 'Fábrica no encontrada'], 404);
        }
        return response()->json($Manu);
    }

    // Actualizar una fábrica
    public function updateManu(Request $request, $id): JsonResponse
    {
        $Manu = Manufacturing::find($id);
        if (!$Manu) {
            return response()->json(['message' => 'Manufactura no encontrada'], 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'products' => 'sometimes|array',
            'factory_id' => 'sometimes|exists:factories,id'
        ]);

        $Manu->update($request->all());

        return response()->json([
            'message' => 'Manufactura actualizada correctamente',
            'Manu' => $Manu
        ]);
    }

    // Eliminar una fábrica
    public function deleteManu($id): JsonResponse
    {
        $Manu = Manufacturing::find($id);
        if (!$Manu) {
            return response()->json(['message' => 'Fábrica no encontrada'], 404);
        }

        $Manu->delete();

        return response()->json(['message' => 'Fábrica eliminada correctamente']);
    }
}