<?php

namespace App\Http\Controllers;

use App\Models\Activitie;
use Illuminate\Http\Request;

class ActivitiesController extends Controller
{
    /**
     * Mostrar todas las actividades.
     */
    public function getActividad()
    {
        return response()->json(Activitie::all(), 200);
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
            'has_time' => 'boolean', // Campo para indicar si se desea agregar tiempo
            'duration' => 'nullable', // Formato para el tiempo HH:MM
        ]);

        // Obtener el último código y sumarle 1
        $lastCode = Activitie::max('code') ?? 0;
        $newCode = $lastCode + 1;

        // Agregar el nuevo código al array de datos validados
        $validatedData['code'] = $newCode;

        // Crear la actividad con el código generado
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
        $Activitie = Activitie::find($id);

        if (!$Activitie) {
            return response()->json(['message' => 'Actividad no encontrada'], 404);
        }

        $request->validate([
            'code' => 'integer|unique:activities,code,' . $id,
            'description' => 'string',
            'config' => 'json',
            'binding' => 'boolean',
            'has_time' => 'boolean', // Validar el campo has_time
            'duration' => 'nullable|', // Validar el campo duration
        ]);

        $Activitie->update([
            'code' => $request->code ?? $Activitie->code,
            'description' => $request->description ?? $Activitie->description,
            'config' => $request->config ? json_decode($request->config, true) : $Activitie->config,
            'binding' => $request->binding ? 1 : 0, // Convertir a 0 o 1
            'has_time' => $request->has_time ?? $Activitie->has_time, // Actualizar has_time si está presente
            'duration' => $request->duration ?? $Activitie->duration, // Actualizar duration si está presente
        ]);

        return response()->json(['message' => 'Actividad actualizada', 'data' => $Activitie], 200);
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

        $Activitie->delete();

        return response()->json(['message' => 'Actividad eliminada'], 200);
    }
}