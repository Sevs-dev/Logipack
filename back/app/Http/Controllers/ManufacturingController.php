<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Manufacturing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ManufacturingController extends Controller
{
    // Obtener todas las fábricas
    public function getManu(): JsonResponse
    {
        $Manu = Manufacturing::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('manufacturings as a2')
                    ->whereColumn('a2.reference_id', 'manufacturings.reference_id');
            })
            ->get();

        return response()->json($Manu, 200);
    }

    public function newManu(Request $request): JsonResponse
    {
        try {
            //// Log::info('📥 Request recibido en newManu', ['data' => $request->all()]);

            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'products' => 'required|array',
                'factory_id' => 'required|exists:factories,id',
                'user' => 'string|nullable',
            ]);

            //// Log::info('✅ Datos validados correctamente', ['validated' => $validatedData]);

            $validatedData['version'] = '1';
            $validatedData['reference_id'] = (string) Str::uuid();

            $Manu = Manufacturing::create($validatedData);

            //// Log::info('✅ Manufacturing creado exitosamente', ['Manu' => $Manu]);

            return response()->json([
                'message' => 'Línea creada exitosamente',
                'Manu' => $Manu
            ], 201);
        } catch (\Throwable $e) {
            // Log::error('❌ Error al crear Manufacturing', [
            //     'message' => $e->getMessage(),
            //     'trace' => $e->getTraceAsString(),
            // ]);

            return response()->json([
                'message' => 'Error al crear manufactura',
                'error' => $e->getMessage()
            ], 500);
        }
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

        $validatedData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'products' => 'sometimes|array',
            'factory_id' => 'sometimes|exists:factories,id',
            'user' => 'string|nullable',
        ]);

        // Crear nueva versión
        $newVersion = (int) $Manu->version + 1;

        $new = $Manu->replicate(); // duplica todos los atributos excepto la PK
        $new->version = $newVersion;
        $new->fill($validatedData);
        $new->reference_id = $Manu->reference_id ?? (string) Str::uuid();
        $new->active = true; // activamos la nueva versión
        $new->save();

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
        // Se elimina el product de la base de datos
        $Manu->active = false;
        $Manu->save();
        return response()->json(['message' => 'Fábrica eliminada correctamente']);
    }
}
