<?php

namespace App\Http\Controllers;

use App\Models\Activitie;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


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

        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();

        $Actividad = Activitie::create($validatedData);

        // Aquí NO necesitas hacer nada con 'user'

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
        $original = Activitie::find($id);

        if (!$original) {
            return response()->json(['message' => 'Actividad no encontrada'], 404);
        }

        $request->validate([
            'description' => 'string',
            'config' => 'json',
            'binding' => 'boolean',
            'has_time' => 'boolean',
            'duration' => 'nullable',
            'user' => 'string|nullable',
        ]);

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

        // Opcional: Podés marcar la versión anterior como inactive
        $original->active = false;
        $original->save();

        return response()->json([
            'message' => 'Actividad actualizada. Nueva versión creada.',
            'data' => $newActividad
        ], 200);
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