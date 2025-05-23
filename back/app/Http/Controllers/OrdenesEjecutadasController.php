<?php

namespace App\Http\Controllers;

use App\Models\OrdenesEjecutadas;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrdenesEjecutadasController extends Controller
{
    public function getAll(): JsonResponse
    {
        $response = OrdenesEjecutadas::all();
        return response()->json($response);
    }

    public function getAllByAdaptationId($id): JsonResponse
    {
        $fases = DB::table('detalle_ejecutar_ordenes')
        ->where('id_adaptation', $id)
        ->groupBy('descripcion_stage')
        ->get();
    
        $lineas = DB::table('detalle_ejecutar_ordenes')
        ->where('id_adaptation', $id)
        ->get();
    
        return response()->json([
            'fases' => $fases,
            'lineas' => $lineas
        ]);
    }

}
