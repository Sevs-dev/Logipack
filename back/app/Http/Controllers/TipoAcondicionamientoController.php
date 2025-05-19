<?php

namespace App\Http\Controllers;

use App\Models\TipoAcondicionamiento;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
class TipoAcondicionamientoController extends Controller
{
    
    public function getAll(): JsonResponse
    {
        $TipoAcondicionamiento = TipoAcondicionamiento::all();
        return response()->json($TipoAcondicionamiento);
    }

    public function newTipoAcondicionamiento(Request $request): JsonResponse    
    {
        // Se crea un nuevo registro en la tabla Role  
        // - Si no, se guarda un array vacío codificado a JSON.
        $TipoAcondicionamiento = TipoAcondicionamiento::create([
            'descripcion' => $request->descripcion, 
        ]);

        // Se devuelve una respuesta JSON con un mensaje de éxito y el objeto Role creado, usando el código HTTP 201 (Creado)
        return response()->json([
            'message' => 'Línea creada exitosamente',
            'TipoAcondicionamiento' => $TipoAcondicionamiento,
            'id' => $TipoAcondicionamiento->id // Retorna solo el ID
        ], 201);
    }   

    public function updateTipoAcondicionamiento(Request $request, $id)
    {
        $TipoAcondicionamiento = TipoAcondicionamiento::find($id);
        $TipoAcondicionamiento->update($request->all());
        return response()->json($TipoAcondicionamiento);
    }

    public function deleteTipoAcondicionamiento($id)
    {
        $TipoAcondicionamiento = TipoAcondicionamiento::find($id);
        $TipoAcondicionamiento->delete();
        return response()->json(['message' => 'Tipo de acondicionamiento eliminado correctamente']);
    }

    public function getTipoAcondicionamiento($id)
    {
        $TipoAcondicionamiento = TipoAcondicionamiento::find($id);
        return response()->json($TipoAcondicionamiento);
    }
}
