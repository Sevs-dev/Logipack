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
        // Obtener lista de adaptaciones
        $acondicionamiento = DB::table('adaptations as ada')
        ->join('adaptation_dates as ada_date', 'ada.id', '=', 'ada_date.adaptation_id')
        ->join('maestras as mae', 'mae.id', '=', 'ada.master')
        ->where('ada.id', $id)
        ->select(
            'ada.id as adaptation_id',
            'ada.number_order',
            'ada.master as maestra_id',
            'mae.descripcion as descripcion_maestra',
            'ada_date.line as linea_produccion',
            // 'ada_date.activities as linea_actividades',
            'mae.type_acondicionamiento as maestra_tipo_acondicionamiento_fk',
            'mae.type_stage as maestra_fases_fk',
            'ada_date.status_dates'
        )->get();
        
        // Obtener lista de tipos de acondicionamiento y sus actividades
        $maestra_tipo_acondicionamiento_fk = DB::table('adaptations as ada')
        ->join('maestras as mae', 'mae.id', '=', 'ada.master')
        ->leftJoin('tipo_acondicionamientos as tipo_acon', function($join) {
            $join->on(DB::raw('FIND_IN_SET(tipo_acon.id, REPLACE(REPLACE(COALESCE(mae.type_acondicionamiento, \'\'), \'[\', \'\'), \']\', \'\'))'), '>', DB::raw('0'));
        })
        ->join('linea_tipo_acondicionamientos as lin_tipo_acon', 'tipo_acon.id', '=', 'lin_tipo_acon.tipo_acondicionamiento_id')
        ->leftJoin('stages as std', 'std.id', '=', 'lin_tipo_acon.fase')
        ->where('ada.id', $id)
        ->select(
            'tipo_acon.id as tipo_acondicionamiento_id',
            'tipo_acon.descripcion as descripcion_tipo_acondicionamiento',
            'lin_tipo_acon.descripcion as descripcion_linea_tipo_acondicionamiento',
            'lin_tipo_acon.fase AS fases_fk', 
            'std.description AS descripcion_fase',
            'std.repeat_line'
        )->get();

        foreach ($maestra_tipo_acondicionamiento_fk as $tipo_acondicionamiento) {
            $list = DB::table('stages as std')
            ->leftJoin('activities as atc', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(atc.id, REPLACE(REPLACE(COALESCE(std.activities, ''), '[', ''), ']', ''))"), '>', DB::raw('0'));
            })
            ->where('std.id', $tipo_acondicionamiento->fases_fk)
            ->select(
                'atc.id as id_activitie',
                'atc.description as descripcion_activitie',
                'atc.config',
                'atc.binding'
            )
            ->get();

            // Asignar actividades al tipo de acondicionamiento
            $tipo_acondicionamiento->actividades = $list;
            
            // Si el tipo de acondicionamiento se repite en la linea de produccion
            if ($tipo_acondicionamiento->repeat_line) {
                
                // duplicar el tipo de acondicionamiento
                for($i = 1; $i < count(json_decode($acondicionamiento[0]->linea_produccion)) + 1; $i++) {
                    $propiedad = "actividades_" . $i;
                    $tipo_acondicionamiento->{$propiedad} = $list;
                }
            }            
        }
        
        // Obtener lista de fases y sus actividades
        $maestra_fases_fk = DB::table('adaptations as ada')
        ->join('maestras as mae', 'mae.id', '=', 'ada.master')
        ->leftJoin('stages as std', function ($join) {
            $join->on(DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(COALESCE(mae.type_stage, ''), '[', ''), ']', ''))"), '>', DB::raw('0'));
        })
        ->where('ada.id', $id)
        ->selectRaw("
            NULL as tipo_acondicionamiento_id,
            NULL as descripcion_tipo_acondicionamiento,
            NULL as descripcion_linea_tipo_acondicionamiento,
            std.id as fases_fk,
            std.description AS 'descripcion_fase', 
            std.repeat_line
        ")->get();

        foreach ($maestra_fases_fk as $fase) {
            $list = DB::table('stages as std')
            ->leftJoin('activities as atc', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(atc.id, REPLACE(REPLACE(COALESCE(std.activities, ''), '[', ''), ']', ''))"), '>', DB::raw('0'));
            })
            ->where('std.id', $fase->fases_fk)
            ->select(
                'atc.id as id_activitie',
                'atc.description as descripcion_activitie',
                'atc.config',
                'atc.binding'
            )
            ->get();
            
            // Asignar actividades a la fase
            $fase->actividades = $list;
            
            // Si la fase se repite en la linea de produccion
            if ($fase->repeat_line) {

                // duplicar la fase
                $lineas = json_decode($acondicionamiento[0]->linea_produccion);
                for($i = 1; $i < count($lineas) + 1; $i++) {
                    $propiedad = "actividades_" . $i;
                    $fase->{$propiedad} = $list;
                }
            }
        };

        return response()->json([
            'acondicionamiento' => $acondicionamiento,
            'maestra_tipo_acondicionamiento_fk' => $maestra_tipo_acondicionamiento_fk,
            'maestra_fases_fk' => $maestra_fases_fk,
        ]);
    }

    

}
