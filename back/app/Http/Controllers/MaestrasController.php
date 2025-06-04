<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Maestra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MaestrasController extends Controller
{
    // Obtener todas las Maestras
    public function getMaestra(): JsonResponse
    {
        $Maestra = Maestra::all();
        return response()->json($Maestra);
    }

    public function newMaestra(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'descripcion' => 'required|string',
            'requiere_bom' => 'required|boolean',
            'type_product' => 'required|string',
            'type_acondicionamiento' => 'nullable|array',
            'type_stage' => 'required|array',
            'status_type' => 'nullable|string',
            'aprobado' => 'required|boolean',
            'paralelo' => 'nullable|boolean',
            'duration' => 'nullable',
            'duration_user' => 'nullable',
        ]);
        // Limpiamos espacios en cada elemento de type_stage
        if (isset($validatedData['type_stage']) && is_array($validatedData['type_stage'])) {
            $validatedData['type_stage'] = array_map(fn($item) => trim($item), $validatedData['type_stage']);
        }
        // Generar código autoincremental manualmente
        $lastCode = Maestra::max('code') ?? 0;
        $validatedData['code'] = $lastCode + 1;
        // Crear la nueva Fase
        $Maestra = Maestra::create($validatedData);
        return response()->json([
            'message' => 'Línea creada exitosamente',
            'Maestra' => $Maestra
        ], 201);
    }

    // Obtener una Maestra por ID
    public function MaestraId($id): JsonResponse
    {
        $Maestra = Maestra::find($id);
        if (!$Maestra) {
            return response()->json(['message' => 'Maestra no encontrada'], 404);
        }
        return response()->json($Maestra);
    }

    // Actualizar una Maestra
    public function updateMaestra(Request $request, $id): JsonResponse
    {
        $Maestra = Maestra::find($id);
        if (!$Maestra) {
            return response()->json(['message' => 'Maestrafactura no encontrada'], 404);
        }
        $validatedData = $request->validate([
            'descripcion' => 'required|string',
            'requiere_bom' => 'required|boolean',
            'type_product' => 'required|string',
            'type_acondicionamiento' => 'nullable|array',
            'type_stage' => 'required|array',
            'status_type' => 'nullable|string',
            'aprobado' => 'required|boolean',
            'paralelo' => 'nullable|boolean',
            'duration' => 'nullable',
            'duration_user' => 'nullable',
        ]);
        // Limpiar espacios en cada elemento de type_stage
        if (isset($validatedData['type_stage']) && is_array($validatedData['type_stage'])) {
            $validatedData['type_stage'] = array_map(fn($item) => trim($item), $validatedData['type_stage']);
        }
        $Maestra->update($validatedData);
        return response()->json([
            'message' => 'Maestrafactura actualizada correctamente',
            'Maestra' => $Maestra
        ]);
    }

    // Eliminar una Maestra
    public function deleteMaestra($id): JsonResponse
    {
        $Maestra = Maestra::find($id);
        if (!$Maestra) {
            return response()->json(['message' => 'Maestra no encontrada'], 404);
        }

        $Maestra->delete();

        return response()->json(['message' => 'Maestra eliminada correctamente']);
    }

    public function obtenerTipos()
    {
        // URL de la API
        $url = 'http://129.146.161.23/BackEnd_Orion/lista_articulos.php?tipos_art';

        // Realizamos la solicitud GET
        $response = Http::get($url);

        // Verificamos si la respuesta fue exitosa
        if ($response->successful()) {
            // Obtenemos los datos de la respuesta (un array de objetos)
            $tiposArticulos = $response->json();

            // Extraemos solo el campo 'tipo' de cada elemento
            $tipos = collect($tiposArticulos)->pluck('tipo');

            // Retornamos los tipos como respuesta JSON
            return response()->json($tipos);
        } else {
            // Si la solicitud falló, retornamos un error
            return response()->json(['error' => 'No se pudieron obtener los tipos de artículos'], 500);
        }
    }
}