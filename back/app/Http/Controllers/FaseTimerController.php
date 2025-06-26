<?php

namespace App\Http\Controllers;

// use App\Models\OrdenesEjecutadas;
// use App\Models\ActividadesEjecutadas;
// use App\Models\AdaptationDate;
use App\Models\Timer;
use App\Models\Stage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FaseTimerController extends Controller
{
    /**
     * Listar todas las fases de control ejecutadas
     *
     * @return JsonResponse
     */
    public function getAll(): JsonResponse
    {
        $response = Timer::all();
        return response()->json($response);
    }

    /**
     * Busca la fase de control ejecutada id
     *
     * @return JsonResponse
     */
    public function getFaseTimerControl($id): JsonResponse
    {
        $response = Timer::where('id', $id)->first();
        $maestra_fases_fk = Stage::where('id', $response->stage_id)
        // ->where(DB::raw('LOWER(phase_type)'), '=', DB::raw("LOWER('Control')"))
        ->first();
        return response()->json([
            'message' => 'Estado de la fase de control pendiente',
            'estado' => 100,
            'maestra_fases_fk' => $maestra_fases_fk,
        ]);
    }
}
