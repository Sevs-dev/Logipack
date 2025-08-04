<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Maestra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MaestrasController extends Controller
{
    // Obtener todas las Maestras
    public function getMaestra(): JsonResponse
    {
        $Maestra = Maestra::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('maestras as a2')
                    ->whereColumn('a2.reference_id', 'maestras.reference_id');
            })
            ->get();

        return response()->json($Maestra, 200);
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
            'user' => 'string|nullable',
        ]);
        // Limpiar y normalizar type_stage
        if (isset($validatedData['type_stage']) && is_array($validatedData['type_stage'])) {
            $validatedData['type_stage'] = array_values(
                array_map(fn($item) => intval($item), $validatedData['type_stage'])
            );
        }
        // Generar código autoincremental manualmente
        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();
        // Crear la nueva Maestra
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
            'user' => 'string|nullable',
        ]);
        // Limpiar y normalizar type_stage
        if (isset($validatedData['type_stage']) && is_array($validatedData['type_stage'])) {
            $validatedData['type_stage'] = array_values(
                array_map(fn($item) => intval($item), $validatedData['type_stage'])
            );
        }
        // Crear nueva versión
        $newVersion = (int) $Maestra->version + 1;
        $newMaestra = $Maestra->replicate(); // duplica todos los atributos excepto la PK
        $newMaestra->version = $newVersion;
        $newMaestra->fill($validatedData);
        $newMaestra->reference_id = $Maestra->reference_id ?? (string) Str::uuid();
        $newMaestra->active = true; // activamos la nueva versión
        $newMaestra->save();
        return response()->json([
            'message' => 'Maestrafactura actualizada correctamente',
            'Maestra' => $newMaestra // ojo aquí: devuelves la nueva versión, no la vieja
        ]);
    }

    // Eliminar una Maestra
    public function deleteMaestra($id): JsonResponse
    {
        $Maestra = Maestra::find($id);
        if (!$Maestra) {
            return response()->json(['message' => 'Maestra no encontrada'], 404);
        }

        $Maestra->active = false;
        $Maestra->save();

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

    public function getMuestreo($id): JsonResponse
    {
       // Log::info("🔍 [MaestraIdStage] Buscando maestra con ID: $id");

        $maestra = Maestra::find($id);

        if (!$maestra) {
            Log::warning("⚠️ [MaestraIdStage] Maestra no encontrada con ID: $id");
            return response()->json(['message' => 'Maestra no encontrada'], 404);
        }

       // Log::info("✅ [MaestraIdStage] Maestra encontrada", ['maestra_id' => $maestra->id]);

        $actividadesMuestreo = collect();

        foreach ($maestra->stages as $stage) {
           // Log::info("➡️ [MaestraIdStage] Analizando stage", ['stage_id' => $stage->id]);

            foreach ($stage->activities as $actividad) {
                Log::debug("🔎 [MaestraIdStage] Actividad encontrada", [
                    'actividad_id' => $actividad->id,
                    'config' => $actividad->config,
                ]);

                $config = json_decode($actividad->config, true);

                if (isset($config['type']) && $config['type'] === 'muestreo') {
                   // Log::info("🎯 [MaestraIdStage] Actividad tipo 'muestreo' detectada", [
                    //     'actividad_id' => $actividad->id,
                    // ]);

                    $actividadesMuestreo->push($actividad);
                }
            }
        }

       // Log::info("📦 [MaestraIdStage] Actividades tipo muestreo recolectadas", [
        //     'cantidad' => $actividadesMuestreo->count(),
        //     'ids' => $actividadesMuestreo->pluck('id'),
        // ]);

        return response()->json([
            'maestra_id' => $maestra->id,
            'actividades_muestreo' => $actividadesMuestreo->values(),
        ]);
    }
}