<?php

namespace App\Http\Controllers;

use App\Models\Activitie;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;


class ActivitiesController extends Controller
{
    /**
     * Mostrar todas las actividades.
     */
    public function getActividad()
    {
        // Traer sólo las actividades activas que sean la última versión por reference_id
        $activities = Activitie::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('activities as a2')
                    ->whereColumn('a2.reference_id', 'activities.reference_id');
            })
            ->get();

        return response()->json($activities, 200);
    }

    /**
     * Crear una nueva actividad.
     */
    public function newActividad(Request $request)
    {
        $validatedData = $request->validate([
            'description' => 'required|string',
            'config' => 'required|json',
            'binding' => 'boolean',
            'has_time' => 'boolean',
            'duration' => 'nullable',
            'user' => 'string|nullable',
        ]);

        // Normalizar el JSON para que quede sin espacios ni saltos de línea
        $validatedData['config'] = json_encode(json_decode($validatedData['config']), JSON_UNESCAPED_SLASHES);

        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();

        $Actividad = Activitie::create($validatedData);

        return response()->json([
            'message' => 'Fase creada exitosamente',
            'Fase' => $Actividad
        ], 201);
    }

    /**
     * Mostrar una actividad específica.
     */
    public function ActividadId($id)
    {
        $Activitie = Activitie::find($id);

        if (!$Activitie) {
            return response()->json(['message' => 'Actividad no encontrada'], 404);
        }

        return response()->json($Activitie, 200);
    }

    /**
     * Actualizar una actividad.
     */
    public function updateActividad(Request $request, $id)
    {
        Log::info('Petición recibida para actualizar actividad', [
            'id' => $id,
            'payload' => $request->all()
        ]);

        $original = Activitie::find($id);

        if (!$original) {
            Log::warning("Actividad con ID $id no encontrada.");
            return response()->json(['message' => 'Actividad no encontrada'], 404);
        }

        try {
            $request->validate([
                'description' => 'string',
                'config' => 'json',
                'binding' => 'boolean',
                'has_time' => 'boolean',
                'duration' => 'nullable',
                'user' => 'string|nullable',
            ]);

            Log::info('Validación exitosa', $request->all());

            // Clonar el registro original
            $newActividad = $original->replicate();

            // Mantener el mismo reference_id para vincular versiones
            $newActividad->reference_id = $original->reference_id;

            // Incrementar la versión
            $newActividad->version = (int)$original->version + 1;

            // Actualizar con los valores nuevos si vienen, si no, dejar el original
            $newActividad->description = $request->description ?? $original->description;
            $newActividad->config = $request->config ? json_decode($request->config, true) : $original->config;
            $newActividad->binding = $request->binding ?? $original->binding;
            $newActividad->has_time = $request->has_time ?? $original->has_time;
            $newActividad->duration = $request->duration ?? $original->duration;
            $newActividad->user = $request->user ?? $original->user;

            // Guardar la nueva versión
            $newActividad->save();

            // Marcar original como inactivo
            $original->active = false;
            $original->save();

            Log::info("Actividad actualizada correctamente. Nueva ID: {$newActividad->id}");

            return response()->json([
                'message' => 'Actividad actualizada. Nueva versión creada.',
                'data' => $newActividad
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al actualizar actividad', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar una actividad.
     */
    public function deleteActividad($id)
    {
        $Activitie = Activitie::find($id);

        if (!$Activitie) {
            return response()->json(['message' => 'Actividad no encontrada'], 404);
        }

        $Activitie->active = false;
        $Activitie->save();

        return response()->json(['message' => 'Actividad desactivada'], 200);
    }
}