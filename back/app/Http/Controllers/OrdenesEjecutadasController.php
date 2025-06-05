<?php

namespace App\Http\Controllers;

use App\Models\OrdenesEjecutadas;
use App\Models\ActividadesEjecutadas;
use App\Models\AdaptationDate;
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
            ->leftJoin('tipo_acondicionamientos as tipo_acon', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(tipo_acon.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mae.type_acondicionamiento, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
            })
            ->join('linea_tipo_acondicionamientos as lin_tipo_acon', 'tipo_acon.id', '=', 'lin_tipo_acon.tipo_acondicionamiento_id')
            ->Join('stages as std', 'std.id', '=', 'lin_tipo_acon.fase')
            ->where('ada.id', $id)
            ->select(
                'tipo_acon.id as tipo_acondicionamiento_id',
                'tipo_acon.descripcion as descripcion_tipo_acondicionamiento',
                'lin_tipo_acon.descripcion as descripcion_linea_tipo_acondicionamiento',
                'lin_tipo_acon.fase AS fases_fk',
                'std.description AS descripcion_fase',
                'std.repeat_line'
            )->get();

        // Recorrer cada tipo de acondicionamiento
        foreach ($maestra_tipo_acondicionamiento_fk as $tipo_acondicionamiento) {
            $list = DB::table('stages as std')
                ->leftJoin('activities as atc', function ($join) {
                    $join->on(DB::raw("FIND_IN_SET(atc.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(std.activities, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
                })
                ->where('std.id', $tipo_acondicionamiento->fases_fk)
                ->select(
                    'atc.id as id_activitie',
                    'atc.description as descripcion_activitie',
                    'atc.config',
                    'atc.binding'
                )
                ->get();

            // Array para almacenar las actividades
            $actividades = [];
            // Si el tipo de acondicionamiento se repite en la linea de produccion
            if ($tipo_acondicionamiento->repeat_line) {
                // Duplicar el tipo de acondicionamiento
                for ($a = 0; $a < count(json_decode($acondicionamiento[0]->linea_produccion)); $a++) {
                    $actividades[] = clone $list;
                }
            } else {
                $actividades[] = clone $list;
            }
            // Asignar actividades al tipo de acondicionamiento
            $tipo_acondicionamiento->actividades = $actividades;
        }

        // Obtener lista de fases y sus actividades
        $maestra_fases_fk = DB::table('adaptations as ada')
            ->join('maestras as mae', 'mae.id', '=', 'ada.master')
            ->leftJoin('stages as std', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mae.type_stage, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
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

        // Recorrer cada fase
        for ($i = 0; $i < count($maestra_fases_fk); $i++) {
            $list = DB::table('stages as std')
                ->leftJoin('activities as atc', function ($join) {
                    $join->on(DB::raw("FIND_IN_SET(atc.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(std.activities, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
                })
                ->where('std.id', $maestra_fases_fk[$i]->fases_fk)
                ->select(
                    'atc.id as id_activitie',
                    'atc.description as descripcion_activitie',
                    'atc.config',
                    'atc.binding'
                )
                ->get();

            // Array para almacenar las actividades
            $actividades = [];
            // Si la fase se repite en la linea de produccion (duplicala la cantidad de actividades)
            if ($maestra_fases_fk[$i]->repeat_line) {
                for ($a = 0; $a < count(json_decode($acondicionamiento[0]->linea_produccion)); $a++) {
                    $actividades[] = clone $list;
                }
            } else {
                // Si la fase no se repite en la linea de produccion (1 sola actividad)
                $actividades[] = clone $list;
            }
            // Asignar actividades a la fase
            $maestra_fases_fk[$i]->actividades = $actividades;
        };

        return response()->json([
            'acondicionamiento' => $acondicionamiento,
            'maestra_tipo_acondicionamiento_fk' => $maestra_tipo_acondicionamiento_fk,
            'maestra_fases_fk' => $maestra_fases_fk,
        ]);
    }

    public function newOrdnesEjecutadas(Request $request): JsonResponse
    {

        // registro de la ordenes
        $ordenes = $request->all()[0];
        $orden = OrdenesEjecutadas::create([
            'adaptation_id' => $ordenes['adaptation_id'],
            'maestra_id' => $ordenes['maestra_id'],
            'number_order' => $ordenes['number_order'],
            'descripcion_maestra' => $ordenes['descripcion_maestra'],
            'maestra_fases_fk' => $ordenes['maestra_fases_fk'],
            'maestra_tipo_acondicionamiento_fk' => $ordenes['maestra_tipo_acondicionamiento_fk'],
            'linea_produccion' => $ordenes['linea_produccion'],
        ]);

        // obtener el id del registro creado
        $orden_id = $orden->id;

        // registrar actividades
        $actividades = $request->all();
        for ($i = 1; $i < count($actividades); $i++) {
            ActividadesEjecutadas::create([
                'orden_id' => $orden_id,
                'adaptation_id' => $ordenes['adaptation_id'],
                'number_order' => $ordenes['number_order'],
                'tipo_acondicionamiento_fk' => $actividades[$i]['tipo_acon'],
                'fases_fk' => $actividades[$i]['stage'],
                'datos_forms' => json_encode($actividades[$i]),
            ]);
        }

        // se actualiza el estado de la adaptacion
        $adaptation_dates = AdaptationDate::where('adaptation_id', $ordenes['adaptation_id'])->first();
        $adaptation_dates->status_dates = 'Completado';
        $adaptation_dates->save();

        // Devolver una respuesta JSON con un mensaje de éxito y el objeto orden creado
        return response()->json([
            'message' => 'Orden ejecutada creada exitosamente',
            'orden' => $orden,
        ]);
    }

    public function getByAdaptationId($id): JsonResponse
    {
        // Obtener todas las órdenes que tengan ese adaptation_id
        $ordenes = OrdenesEjecutadas::where('adaptation_id', $id)->get();

        if ($ordenes->isEmpty()) {
            return response()->json(['message' => 'No se encontraron órdenes para esta adaptación'], 404);
        }

        // Por cada orden, le agregamos sus actividades
        $ordenesConActividades = $ordenes->map(function ($orden) {
            $orden->actividades = ActividadesEjecutadas::where('orden_id', $orden->id)->get();
            return $orden;
        });

        return response()->json($ordenesConActividades);
    }
}