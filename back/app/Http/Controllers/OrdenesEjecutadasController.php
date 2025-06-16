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
        ->leftJoin('tipo_acondicionamientos as tipo_acon', function($join) {
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

                // Calcular tamaño del la linea de produccion
                $linea_produccion_size = count(json_decode($acondicionamiento[0]->linea_produccion));
                if ($linea_produccion_size < 2) {
                    $linea_produccion_size = 2;
                };
            
                // Duplicar el tipo de acondicionamiento
                for ($a = 0; $a < $linea_produccion_size; $a++) {
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
        foreach ($maestra_fases_fk as $fase) {

            // obtener lista si la fase es distinta de null
            $list = $fase->fases_fk == null ? [] : DB::table('stages as std')
            ->join('activities as atc', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(atc.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(std.activities, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
            })
            ->where('std.id', $fase->fases_fk)
            ->select(
                'atc.id as id_activitie',
                'atc.description as descripcion_activitie',
                'atc.config',
                'atc.binding'
            )
            ->get();

            // instancia de actividades y verificar lista
            $fase->actividades = array();
            if(!empty($list) && count($list) > 0){

                // Validar si tiene lienas asignadas
                $linea_produccion_size = count(json_decode($acondicionamiento[0]->linea_produccion));
                if ($linea_produccion_size > 0) {

                    // si no se repite la linea
                    if (!empty($list) && $fase->repeat_line == 0) {

                        // validar y almacenar datos, si no se repite la linea
                        array_push($fase->actividades, $list);
                    }

                    // si se repite la linea
                    if (!empty($list) && $fase->repeat_line == 1) {
                        
                        // Cambiar la cantidad de lineas si es 1, para que sea duplicada
                        if ($linea_produccion_size == 1) {
                            $linea_produccion_size = 2;
                        };

                        // instancia de actividades auxiliares
                        $actividades = [];
                        // recorrer y almacenar datos, si se repite la linea
                        for ($a = 0; $a < $linea_produccion_size; $a++) {
                            // $activida = "actividad_" . $a;
                            // $actividades[$activida] = $list;
                            array_push($fase->actividades,  $list);
                        }
                    }
    
                };
            }
        };

        // instancia de maestra auxiliar
        // $maestra_fase = [];
        // for ($i = 0; $i < count($maestra_fases_fk); $i++) {

        //     //  recorre y decine marcas a la cabecera de la fase
        //     $fase = "fase_" . $i;
        //     $maestra_fase[$i][$fase] = [$maestra_fases_fk[$i]];
        // }
        // $maestra_fases_fk = $maestra_fase;

        return response()->json([
            'acondicionamiento' => $acondicionamiento,
            // 'maestra_tipo_acondicionamiento_fk' => $maestra_tipo_acondicionamiento_fk,
            'maestra_fases_fk' => $maestra_fases_fk,
        ]);
    }

    public function newOrdnesEjecutadas(Request $request): JsonResponse{

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
        for ($i=1; $i < count($actividades); $i++) {     
            ActividadesEjecutadas::create([
                'orden_ejecutada' => $orden_id,
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
    /**
     * Validar estado de la orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function validar_estado($id): JsonResponse{
     
        // validar si existe
        $orden = OrdenesEjecutadas::where('adaptation_id', $id)->where('proceso', 'eject')->first();
        if ($orden) {
           
            // validar si el estado es 100
            if ($orden->estado == '100') {
                return response()->json([
                    'message' => 'Estado de la orden pendiente',
                    'estado' => 100,
                    'url' => 'http://localhost:5173/' . $id,
                ]);
            }

            // Orden ejecutada
            return response()->json([
                'message' => 'Estado de la orden ejecutada',
                'estado' => 11500,
            ]);
        }

        // orden no encontrada
        return response()->json([
            'message' => 'Orden ejecutada no encontrada',
            'estado' => null,
            'url' => 'http://localhost:5173/' . $id,
        ]);
    }

    /**
     * Procesar orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function procesar_orden($id): JsonResponse{

        // Obtener estado de la orden
        $resp = $this->validar_estado($id);
        $etsado_orden = json_decode($resp->getContent(), true); // true = array asociativo

        // procesar plantilla existente
        if ($etsado_orden['estado'] == 100) {

            //  Consultar orden generada y su fase
            $acondicionamiento = OrdenesEjecutadas::where('adaptation_id', $id)
            ->where('proceso', 'eject')
            ->select(
                "id",
                "adaptation_id",
                "maestra_id",
                "number_order",
                "descripcion_maestra",
                "maestra_fases_fk",
                "maestra_tipo_acondicionamiento_fk",
                "linea_produccion",
                "proceso",
                "estado",
            )->first();

            // obtener el id de la orden ejecutada
            $acondicionamiento_id =  $acondicionamiento ? $acondicionamiento->id : null;

            // Consultar fases del tipo de acondicionamiento
            $maestra_tipo_acondicionamiento_fk = DB::table('ordenes_ejecutadas as orden')
            ->join('actividades_ejecutadas as atc', function($join) {
                $join->on('orden.id', '=', 'atc.orden_ejecutada')->whereRaw("
                    FIND_IN_SET(atc.tipo_acondicionamiento_fk,
                        REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(orden.maestra_tipo_acondicionamiento_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')
                    ) > 0
                ");
            })
            ->Join('stages as std', 'std.id', '=', 'atc.fases_fk')
            ->where('orden.id', '=', $acondicionamiento_id)
            ->where('atc.tipo_acondicionamiento_fk', '!=', 0)
            ->select(
                'atc.id',
                'atc.orden_ejecutada',
                'atc.adaptation_id',
                'atc.tipo_acondicionamiento_fk',
                'atc.fases_fk',
                'std.description as description_fase',
                'std.phase_type',
                'atc.forms'
            )
            ->get();

            // Consultar fases 
            $maestra_fases_fk = DB::table('ordenes_ejecutadas as orden')
            ->join('actividades_ejecutadas as atc', function($join) {
                $join->on('orden.id', '=', 'atc.orden_ejecutada')->whereRaw("
                    FIND_IN_SET(atc.fases_fk,
                        REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(orden.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')
                    ) > 0
                ");
            })
            ->Join('stages as std', 'std.id', '=', 'atc.fases_fk')
            ->where('orden.id', '=', $acondicionamiento_id)
            ->where('atc.tipo_acondicionamiento_fk','=', 0)
            ->select(
                'atc.id',
                'atc.orden_ejecutada',
                'atc.adaptation_id',
                'atc.tipo_acondicionamiento_fk',
                'atc.fases_fk',
                'std.description as description_fase',
                'atc.phase_type',
                'atc.forms',
            )->get();
      

            return response()->json([
                'message' => 'Estado de la orden pendiente',
                'estado' => 100,
                'acondicionamiento' => $acondicionamiento,
                'maestra_tipo_acondicionamiento_fk' => $maestra_tipo_acondicionamiento_fk,
                'maestra_fases_fk' => $maestra_fases_fk
            ]);
        }

        // procesar plantilla nueva
        if ($etsado_orden['estado'] == null) {
            
            // Crear cabecera de la orden
            $this->crearCabeceraOrden($id);

            //  Consultar orden generada y su fase
            $ordenes = OrdenesEjecutadas::where('adaptation_id', $id)->where('proceso', 'eject')->first();

            // Obtener lista de tipos de acondicionamiento y sus actividades
            $tipo_acondicionamiento = $this->getTipoAcondicionamiento((
                DB::table('adaptations as ada')
            ->join('ordenes_ejecutadas as mae', 'mae.adaptation_id', '=', 'ada.id')
            ->leftJoin('tipo_acondicionamientos as tipo_acon', function($join) {
                $join->on(DB::raw("FIND_IN_SET(tipo_acon.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mae.maestra_tipo_acondicionamiento_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
            })
            ->join('linea_tipo_acondicionamientos as lin_tipo_acon', 'tipo_acon.id', '=', 'lin_tipo_acon.tipo_acondicionamiento_id')
            ->Join('stages as std', 'std.id', '=', 'lin_tipo_acon.fase')
            ->where('ada.id', isset($ordenes->adaptation_id) ? $ordenes->adaptation_id : null)
            ->select(
                'tipo_acon.id as tipo_acondicionamiento_id',
                'tipo_acon.descripcion as descripcion_tipo_acondicionamiento',
                'lin_tipo_acon.descripcion as descripcion_linea_tipo_acondicionamiento',
                'lin_tipo_acon.fase AS fases_fk', 
                'std.description AS description_fase',
                'std.phase_type',
                'std.repeat_line'
            )->get()), $ordenes);

            // obtener actividades de la fase
            $fases = $this->getActividades((
            DB::table('adaptations as ada')
            ->join('ordenes_ejecutadas as mae', 'mae.adaptation_id', '=', 'ada.id')
            ->leftJoin('stages as std', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mae.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
            })
            ->where('ada.id', isset($ordenes->adaptation_id) ? $ordenes->adaptation_id : null)
            ->selectRaw("
                0 as tipo_acondicionamiento_id,
                NULL as descripcion_tipo_acondicionamiento,
                NULL as descripcion_linea_tipo_acondicionamiento,
                std.id as fases_fk,
                std.description AS 'description_fase', 
                std.phase_type,
                std.repeat_line
            ")->get()), $ordenes);

            // insertar actividades de la orden ejecutada
            $this->crearActividadesOrden($tipo_acondicionamiento, $fases);

            // retornar estructra de respuesta
            return response()->json([
                'message' => 'Orden procesada',
                'acondicionamiento' => json_decode($ordenes, true),
                'maestra_tipo_acondicionamiento_fk' => $tipo_acondicionamiento,
                'maestra_fases_fk' => $fases,
            ]);
        }

        // plantilla procesada
        return response()->json([
            'message' => 'Orden ejecutada procesada',
            'estado' => 11500,
        ]);
    }

    /**
     * Funcion para obtener actividades de tipo acondicionamiento
     * 
     * @param array $tipo_acon
     * @param object $ordenes
     * @return array
     */
    private function getTipoAcondicionamiento($tipo_acon, $ordenes) : array 
    {
        $tipo_acondicionamiento = [];
            foreach ($tipo_acon as $fase) {
                $tipo_acondicionamiento = array_merge($tipo_acondicionamiento, $this->getActividades(json_encode([
                    [
                        "fases_fk" => $fase->fases_fk,
                        "description_fase" => $fase->description_fase ?? "",
                        "phase_type" => $fase->phase_type ?? "",
                        "repeat_line" => $fase->repeat_line,
                        "tipo_acondicionamiento_id" => $fase->tipo_acondicionamiento_id,
                    ]
                ]), $ordenes));
            }
        return $tipo_acondicionamiento;
    }

    /**
     * Funcion para obtener actividades
     * 
     * @param array $fases
     * @param object $ordenes
     * @return array
     */
    private function getActividades($fases, $ordenes) : array 
    {
        // obtener actividades segun la fase
        $acom = [];
        foreach (json_decode($fases, true) as $count => $fase) {
            // obtener lista si la actividades
            $actividades =  DB::table('stages as std')
            ->join('activities as atc', function ($join) {
                $join->on(DB::raw("FIND_IN_SET(atc.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(std.activities, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"), '>', DB::raw('0'));
            })
            ->where('std.id', $fase['fases_fk'])
            ->select(
                'atc.id as id_activitie',
                'atc.description as descripcion_activitie',
                'atc.config',
                'atc.binding',
            )->get();

            // define cuantas veces va a recorrer la lista de actividades
            if(count(json_decode($actividades, true)) > 0){
                $actividades = json_decode($actividades, true);
                if ($fase['repeat_line'] == 1) {
                    for ($i=0; $i < count(json_decode($ordenes->linea_produccion, true)); $i++) {
                        foreach ($actividades as $key => $value) {
                            $clave = implode('', [
                                $ordenes->id,
                                $ordenes->adaptation_id,
                                $fase['tipo_acondicionamiento_id'],
                                $fase['fases_fk'],
                                $value['id_activitie'],
                                $count,
                                $key + ($i + 1),
                            ]);
                            $value['orden_ejecutada'] = $ordenes->id;
                            $value['adaptation_id'] = $ordenes->adaptation_id;
                            $value['tipo_acondicionamiento_fk'] = $fase['tipo_acondicionamiento_id'];
                            $value['fases_fk'] = $fase['fases_fk'];
                            $value['description_fase'] = $fase['description_fase'] ?? "";
                            $value['phase_type'] = $fase['phase_type'] ?? "";
                            $value['actividad_fk'] = $value['id_activitie'];
                            $value['secuencia'] = $count;
                            $value['clave'] = $clave;
                            $value['valor'] = "";
                            $value['copia'] = 'si';
                            $actividades[$key] = $value;
                        }
                        $acom[] = $actividades;
                    }
                }
                foreach ($actividades as $key => $value) {
                    $clave = implode('', [
                        $ordenes->id,
                        $ordenes->adaptation_id,
                        $fase['tipo_acondicionamiento_id'],
                        $fase['fases_fk'],
                        $value['id_activitie'],
                        $count,
                        $key,
                    ]);
                    $value['orden_ejecutada'] = $ordenes->id;
                    $value['adaptation_id'] = $ordenes->adaptation_id;
                    $value['tipo_acondicionamiento_fk'] = $fase['tipo_acondicionamiento_id'];
                    $value['fases_fk'] = $fase['fases_fk'];
                    $value['description_fase'] = $fase['description_fase'] ?? "";
                    $value['phase_type'] = $fase['phase_type'] ?? "";
                    $value['actividad_fk'] = $value['id_activitie'];
                    $value['secuencia'] = $count;
                    $value['clave'] = $clave;
                    $value['valor'] = "";
                    $value['copia'] = 'no';
                    $actividades[$key] = $value;
                }
                $acom[] = $actividades;
            }
        }
        return $acom;
    }


    /**
     * Crear cabecera de la orden ejecutada
     * 
     * @param int $id
     * @return void
     */
    private function crearCabeceraOrden($id) : void
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

        OrdenesEjecutadas::create([
            'adaptation_id' => $acondicionamiento[0]->adaptation_id,
            'maestra_id' => $acondicionamiento[0]->maestra_id,
            'number_order' => $acondicionamiento[0]->number_order,
            'descripcion_maestra' => $acondicionamiento[0]->descripcion_maestra,
            'maestra_fases_fk' => $acondicionamiento[0]->maestra_fases_fk,
            'maestra_tipo_acondicionamiento_fk' => $acondicionamiento[0]->maestra_tipo_acondicionamiento_fk,
            'linea_produccion' => $acondicionamiento[0]->linea_produccion,
        ]);
    }

    /**
     * Crear actividades de la orden ejecutada
     * 
     * @param array $tipo_acondicionamiento
     * @param array $fases
     * @return void
     */
    private function crearActividadesOrden($tipo_acondicionamiento, $fases) : void
    {
        // insertar lineas de tipo acondicionamiento
        foreach ($tipo_acondicionamiento as $tipo) {
            ActividadesEjecutadas::create([
                "orden_ejecutada" => $tipo[0]['orden_ejecutada'],
                "adaptation_id" => $tipo[0]['adaptation_id'],
                "tipo_acondicionamiento_fk" => $tipo[0]['tipo_acondicionamiento_fk'],
                "fases_fk" => $tipo[0]['fases_fk'],
                "description_fase" => $tipo[0]['description_fase'] ?? "",
                "phase_type" => $tipo[0]['phase_type'] ?? "",
                "forms" => json_encode($tipo)
            ]);
        }

        // insertar lineas de fases
        foreach ($fases as $fase) {
            ActividadesEjecutadas::create([
                "orden_ejecutada" => $fase[0]['orden_ejecutada'],
                "adaptation_id" => $fase[0]['adaptation_id'],
                "tipo_acondicionamiento_fk" => $fase[0]['tipo_acondicionamiento_fk'],
                "fases_fk" => $fase[0]['fases_fk'],
                "description_fase" => $fase[0]['description_fase'] ?? "",
                "phase_type" => $fase[0]['phase_type'] ?? "",
                "forms" => json_encode($fase)
            ]);
        }
    }
}
