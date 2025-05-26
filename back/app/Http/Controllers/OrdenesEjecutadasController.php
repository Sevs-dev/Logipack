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
        // $fases = DB::table('detalle_ejecutar_ordenes')
        // ->where('id_adaptation', $id)
        // ->groupBy('descripcion_stage')
        // ->get();
        $fases = DB::table(DB::raw('(
            SELECT
                CONCAT(ada.id, "_", mue.id, "_", std.id, "_", atc.id) AS codigo,  
                ada.id AS id_adaptation,
                ada.number_order,
                mue.id AS id_muestra,
                mue.descripcion AS descripcion_muestra,
                mue.type_stage AS fk_stages,
                std.id AS id_stage,
                std.description AS descripcion_stage,
                std.phase_type,
                std.status,
                std.activities AS fk_activities,
                atc.id AS id_activitie,
                atc.description AS descripcion_activitie,
                atc.config,
                atc.binding
            FROM adaptations ada
            LEFT JOIN maestras mue
                ON ada.master = mue.id
            LEFT JOIN stages std
                ON FIND_IN_SET(
                    std.id,
                    REPLACE(REPLACE(COALESCE(mue.type_stage, ""), "[", ""), "]", "")
                ) > 0 AND std.status IS TRUE
            LEFT JOIN activities atc
                ON FIND_IN_SET(
                    atc.id,
                    REPLACE(REPLACE(COALESCE(std.activities, ""), "[", ""), "]", "")
                ) > 0
            ORDER BY ada.id ASC
        ) AS sub'))
        ->where('sub.id_adaptation', $id)
        ->groupBy('sub.descripcion_stage')
        ->get();

        $lineas = DB::table(DB::raw('(
            SELECT
                CONCAT(ada.id, "_", mue.id, "_", std.id, "_", atc.id) AS codigo,  
                ada.id AS id_adaptation,
                ada.number_order,
                mue.id AS id_muestra,
                mue.descripcion AS descripcion_muestra,
                mue.type_stage AS fk_stages,
                std.id AS id_stage,
                std.description AS descripcion_stage,
                std.phase_type,
                std.status,
                std.activities AS fk_activities,
                atc.id AS id_activitie,
                atc.description AS descripcion_activitie,
                atc.config,
                atc.binding
            FROM adaptations ada
            LEFT JOIN maestras mue
                ON ada.master = mue.id
            LEFT JOIN stages std
                ON FIND_IN_SET(
                    std.id,
                    REPLACE(REPLACE(COALESCE(mue.type_stage, ""), "[", ""), "]", "")
                ) > 0 AND std.status IS TRUE
            LEFT JOIN activities atc
                ON FIND_IN_SET(
                    atc.id,
                    REPLACE(REPLACE(COALESCE(std.activities, ""), "[", ""), "]", "")
                ) > 0
            ORDER BY ada.id ASC
        ) AS sub'))
        ->where('sub.id_adaptation', $id)
        ->get();
    
        // $lineas = DB::table('detalle_ejecutar_ordenes')
        // ->where('id_adaptation', $id)
        // ->get();
    
        return response()->json([
            'fases' => $fases,
            'lineas' => $lineas
        ]);
    }

}
