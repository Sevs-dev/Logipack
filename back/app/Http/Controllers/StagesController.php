<?php

namespace App\Http\Controllers;

use App\Models\Adaptation;
use App\Models\Maestra;
use App\Models\Stage;
use finfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

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
            'role' => 'string|nullable',
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

        Log::info('📥 Request recibido para actualizar fase', [
            'fase_id' => $id,
            'request' => $request->all()
        ]);

        // 🔁 Normalizamos repeatLine → repeat_line si viene con camelCase
        if ($request->has('repeatLine')) {
            $request->merge([
                'repeat_line' => $request->input('repeatLine')
            ]);
        }

        $validatedData = $request->validate([
            'description'     => 'required|string',
            'phase_type'      => 'required|string',
            'repeat'          => 'boolean',
            'repeat_line'     => 'boolean',
            'repeat_minutes'  => 'nullable|integer',
            'alert'           => 'boolean',
            'can_pause'       => 'boolean',
            'status'          => 'boolean',
            'multi'           => 'boolean',
            'activities'      => 'required|array',
            'duration'        => 'nullable|string',
            'duration_user'   => 'nullable|string',
            'user'            => 'string|nullable',
            'role'            => 'string|nullable',
        ]);

        Log::info('✅ Datos validados correctamente', $validatedData);

        // Desactivar versión anterior
        $Fase->active = false;
        $Fase->save();

        // Normalizar activities
        if (isset($validatedData['activities']) && is_array($validatedData['activities'])) {
            $validatedData['activities'] = array_values(
                array_map(fn($item) => intval($item), $validatedData['activities'])
            );
        }

        Log::info('🔧 Datos listos para nueva versión', $validatedData);

        // Crear nueva versión
        $newVersion = (int) $Fase->version + 1;
        $newFase = $Fase->replicate();
        $newFase->version = $newVersion;
        $newFase->fill($validatedData);
        $newFase->reference_id = $Fase->reference_id ?? (string) Str::uuid();
        $newFase->active = true;

        Log::info('🆕 Nueva fase antes de guardar', $newFase->toArray());

        $newFase->save();

        Log::info('💾 Nueva fase guardada', $newFase->toArray());

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

    //Control Stages
    public function controlStages($id): JsonResponse
    {
        Log::info("🔍 Buscando adaptación con ID: $id");

        $adaptation = Adaptation::find($id);
        if (!$adaptation) {
            Log::warning("❌ Adaptación no encontrada para ID: $id");
            return response()->json(['message' => 'Adaptación no encontrada'], 404);
        }

        Log::info("✅ Adaptación encontrada", ['adaptation_id' => $adaptation->id, 'master_id' => $adaptation->master]);

        $master = Maestra::find($adaptation->master);
        if (!$master) {
            Log::warning("❌ Maestra no encontrada con ID: " . $adaptation->master);
            return response()->json(['message' => 'Maestra no encontrada'], 404);
        }

        Log::info("✅ Maestra encontrada", ['maestra_id' => $master->id, 'type_stage' => $master->type_stage]);

        $stageIds = $master->type_stage;
        if (!is_array($stageIds)) {
            Log::error("❌ El campo 'type_stage' no es un array", ['type_stage' => $stageIds]);
            return response()->json(['message' => 'type_stage no es un array'], 400);
        }

        Log::info("📦 Buscando Stage con phase_type = 'Control' en IDs:", ['stage_ids' => $stageIds]);

        $controlStage = Stage::whereIn('id', $stageIds)
            ->whereRaw('LOWER(phase_type) = ?', ['control'])
            ->first();

        if (!$controlStage) {
            Log::warning("⚠️ No se encontró ninguna fase con phase_type = 'Control'", ['searched_ids' => $stageIds]);
            return response()->json(['message' => 'Fase tipo Control no encontrada'], 404);
        }

        Log::info("✅ Fase tipo Control encontrada", ['stage_id' => $controlStage->id, 'phase_type' => $controlStage->phase_type]);

        return response()->json($controlStage);
    }
}