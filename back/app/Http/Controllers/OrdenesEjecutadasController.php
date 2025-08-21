<?php

namespace App\Http\Controllers;

use App\Models\ActividadesEjecutadas;
use App\Models\AdaptationDate;
use App\Models\Conciliaciones;
use App\Models\OrdenesEjecutadas;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenesEjecutadasController extends Controller
{
    /**
     * Validar estado de la orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function validar_estado(
        $id
    ): JsonResponse {
        // validar si existe
        $orden = OrdenesEjecutadas::where('adaptation_date_id', $id)
            ->where('proceso', 'eject')
            ->first();

        // si la orden existe
        if ($orden) {
            // Orden pendiente
            if ($orden->estado == '100') {
                $fases = DB::table('actividades_ejecutadas')
                    ->where('adaptation_date_id', $id)
                    ->where('estado_form', false)
                    ->select(
                        DB::raw('COUNT(*) as count')
                    )
                    ->first();

                if ($fases->count > 0) {
                    return response()->json([
                        'message' => 'Estado de la orden pendiente',
                        'estado' => 100,
                    ]);
                }
            }

            // Orden eliminada
            if ($orden->estado == '12000') {
                return response()->json([
                    'message' => 'Estado de la orden restablecida',
                    'estado' => 12000,
                ]);
            }

            // Orden eliminada
            if ($orden->estado == '-11000') {
                return response()->json([
                    'message' => 'Estado de la orden eliminada',
                    'estado' => -11000,
                ]);
            }

            // Orden ejecutada
            $estado = $this->confirmar_orden($id);  // confirmar orden si es ejecutada
            return response()->json([
                'message' => 'Estado de la orden ejecutada',
                'estado' => $estado,
            ]);
        }

        // si la orden no existe
        return response()->json([
            'message' => 'Orden ejecutada no encontrada',
            'estado' => null,
        ]);
    }

    /**
     * Generar orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function generar_orden(
        $id
    ): JsonResponse {
        // validar si existe la orden
        $validar_estado = $this->validar_estado($id);
        $estado = json_decode($validar_estado->getContent(), true);
        if ($estado['estado'] !== null) {
            return response()->json([
                'message' => 'Orden de acondicionamiento existe',
                'estado' => 200,
            ]);
        }

        // Crear orden de acondicionamiento
        $fases = [];
        try {
            $orden = $this->crear_orden_acondicionamiento($id);
            $fases = $this->crear_actividades_orden($id, $orden);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la orden de acondicionamiento | ' . $e->getMessage(),
                'estado' => 500,
            ]);
        }

        // obtener lineas de la orden
        $lineas = $this->linea_procesos($id);
        $lineas = json_decode($lineas->getContent(), true);

        // Orden creada
        return response()->json([
            'message' => 'Orden de acondicionamiento creada',
            'orden' => $orden,
            'linea_procesos' => $lineas['linea_procesos'],
            'estado' => 200,
        ]);
    }

    /**
     * Eliminar orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function eliminar_orden(
        $id
    ): JsonResponse {
        OrdenesEjecutadas::where('adaptation_date_id', $id)->update([
            'estado' => '-11000',
        ]);

        ActividadesEjecutadas::where('adaptation_date_id', $id)->delete();

        return response()->json([
            'message' => 'Orden de acondicionamiento eliminada',
            'estado' => 200,
        ]);
    }

    /**
     * Linea procesos
     *
     * @param int $id
     * @return JsonResponse
     */
    public function linea_procesos(
        $id
    ): JsonResponse {
        // obtener orden
        $orden = OrdenesEjecutadas::where('adaptation_date_id', $id)
            ->where('proceso', 'eject')
            ->first();

        // Obtener solo las fases de planificación, conciliación y actividades
        $linea_fases_1 = DB::table('ordenes_ejecutadas as ada')
            ->join('stages as std', function ($join) {
                $join->on(
                    DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"),
                    '>',
                    DB::raw('0')
                );
            })
            ->where('ada.adaptation_date_id', $id)
            ->where('ada.proceso', 'eject')
            ->whereIn('std.phase_type', ['Planificación', 'Conciliación'])
            ->select(
                'std.id',
                'std.description as descripcion',
                'std.phase_type',
                DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')) as posicion")
            );

        $linea_fases = DB::table('ordenes_ejecutadas as ada')
            ->join('stages as std', function ($join) {
                $join->on(
                    DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"),
                    '>',
                    DB::raw('0')
                );
            })
            ->where('ada.adaptation_date_id', $id)
            ->where('ada.proceso', 'eject')
            ->whereIn('std.phase_type', ['Actividades'])
            ->where('repeat_line', 0)
            ->select(
                'std.id',
                'std.description as descripcion',
                'std.phase_type',
                DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')) as posicion")
            )
            ->union($linea_fases_1)  // 👈 aquí unes la primera query
            ->orderBy('posicion', 'asc')
            ->get();

        // Recorrer para validar estado de la lineas
        $fases = [];
        foreach ($linea_fases as $item) {
            // Validar si la fase es conciliación
            if ($item->phase_type == 'Conciliación') {
                $fases[] = $item;
            }

            // obtener tamaño de la linea
            $linea = DB::table('actividades_ejecutadas as atc')
                ->where('atc.adaptation_date_id', $id)
                ->where('atc.fases_fk', $item->id)
                ->where('atc.estado_form', 0)
                ->select(
                    DB::raw('COUNT(*) as count')
                )
                ->first();

            // Vlidar si la linea tiene todos los estados en 0
            if ($linea->count > 0) {
                $fases[] = $item;
            }
        }

        // Obtener lineas de procesos
        $linea_procesos = DB::table('ordenes_ejecutadas as ada')
            ->where('ada.adaptation_date_id', $id)
            ->where('ada.proceso', 'eject')
            ->join('manufacturings as man', function ($join) {
                $join->on(
                    DB::raw(
                        "FIND_IN_SET(man.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                        (ada.linea_produccion, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"
                    ),
                    '>',
                    DB::raw('0')
                );
            })
            ->select(
                'man.id',
                'man.name as descripcion',
                DB::raw("'linea' as phase_type"),
                DB::raw("FIND_IN_SET(man.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                        (ada.linea_produccion, ''), '[', ''), ']', ''), ' ', ''), '\"', '')) as posicion")
            )
            ->orderByRaw('posicion ASC')
            ->get();

        // Recorrer para validar estado de la lineas

        $lineas = [];
        foreach ($linea_procesos as $item) {
            // obtener tamaño de la linea
            $linea = DB::table('actividades_ejecutadas as atc')
                ->where('atc.adaptation_date_id', $id)
                ->where('atc.linea', $item->id)
                ->where('atc.estado_form', 0)
                ->select(
                    DB::raw('COUNT(*) as count')
                )
                ->first();

            // Vlidar si la linea tiene todos los estados en 0
            if ($linea->count > 0) {
                $lineas[] = $item;
            }
        }

        return response()->json([
            'orden' => $orden,
            'linea_procesos' => $lineas,
            'linea_fases' => $fases,
            'estado' => 200,
        ]);
    }

    /**
     * Condiciones de la orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function siguiente_fase(
        $id,
        $linea,
        $tipo
    ): JsonResponse {
        $fases = null;
        // Validar tipo de linea
        if ($tipo == 'linea') {
            // Validar tipo de linea
            // Validar si la linea tiene todos los estados en 0
            $fases = DB::table('actividades_ejecutadas')
                ->where('adaptation_date_id', $id)
                ->where('linea', $linea)
                ->where('estado_form', false)
                ->whereNotIn('phase_type', ['Planificación', 'Conciliación', 'Control'])
                ->orderBy('id', 'asc')
                ->first();
        } else {
            // Validar tipo de fase
            // Validar si la linea tiene todos los estados en 0
            $fases = DB::table('actividades_ejecutadas')
                ->where('adaptation_date_id', $id)
                ->where('linea', 0)
                ->where('fases_fk', $linea)
                ->where('estado_form', false)
                ->whereIn('phase_type', ['Planificación', 'Conciliación', 'Actividades'])
                ->where('repeat_line', 0)
                // ->whereNotExists(function ($query) use ($id) {
                //     $query
                //         ->select(DB::raw(1))
                //         ->from('actividades_ejecutadas')
                //         ->where('adaptation_date_id', $id)
                //         ->where('repeat_line', true)
                //         ->where('estado_form', false)
                //         ->whereIn('phase_type', ['Actividades', 'Procesos']);
                // })
                ->orderBy('id', 'asc')
                ->first();
        }
        return response()->json([
            'fases' => $fases,
            'estado' => 200,
        ]);
    }

    /**
     * Fase de control
     *
     * @param int $id
     * @return JsonResponse
     */
    public function getFaseControl($id): JsonResponse
    {
        $fases = DB::table('ordenes_ejecutadas as ada')
            ->where('ada.adaptation_date_id', $id)
            ->where('ada.proceso', 'eject')
            ->join('stages as std', function ($join) {
                $join->on(
                    DB::raw(
                        "FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                    (ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"
                    ),
                    '>',
                    DB::raw('0')
                );
            })
            ->whereIn('std.phase_type', ['Control'])
            ->select(
                'std.id',
                'std.description as descripcion',
                'std.phase_type',
                DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                    (ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')) as posicion")
            )
            ->orderByRaw('posicion ASC')
            ->first();

        return response()->json([
            'fase_control' => $fases,
            'estado' => 200,
        ]);
    }

    /**
     * Fase de control
     *
     * @param int $id
     * @return JsonResponse
     */
    public function getActividadesEjecutadas($id): JsonResponse
    {
        // obtener orden
        $orden = OrdenesEjecutadas::where('adaptation_date_id', $id)
            ->where('proceso', 'eject')
            ->first();

        $actividades = DB::table('actividades_ejecutadas')
            ->where('adaptation_date_id', $id)
            ->where('estado_form', true)
            ->get();

        return response()->json([
            'orden' => $orden,
            'actividades' => $actividades,
            'estado' => 200,
        ]);
    }

    /**
     * Validar rol
     *
     * @param int $id
     * @return JsonResponse
     */
    public function validateRol($fase): JsonResponse
    {
        $fases = DB::table('stages as std')
            ->where('std.id', $fase)
            ->select(
                'std.id',
                'std.description as descripcion',
                'std.phase_type',
                'std.role',
            )
            ->first();

        return response()->json([
            'roles' => $fases,
            'estado' => 200,
        ]);
    }

    /**
     * Condiciones de la fase
     *
     * @param int $id
     * @return JsonResponse
     */
    public function condicionesFase($id, $fase): JsonResponse
    {
        $datos = DB::table('actividades_ejecutadas')
            ->where('adaptation_date_id', $id)
            ->whereIn('fases_fk', function ($query) use ($id, $fase) {
                $query
                    ->select('fases_fk')
                    ->from('actividades_ejecutadas')
                    ->where('adaptation_date_id', $id)
                    ->where('id', '<', function ($subquery) use ($id, $fase) {
                        $subquery
                            ->select('id')
                            ->from('actividades_ejecutadas')
                            ->where('adaptation_date_id', $id)
                            ->where('repeat_line', 0)
                            ->where('fases_fk', $fase)
                            ->orderBy('id')
                            ->limit(1);
                    });
            })
            ->where('phase_type', '!=', 'Conciliación')
            ->where('estado_form', 0)
            ->select(
                DB::raw('COUNT(*) as count')
            )
            ->first();

        return response()->json([
            'condicion_1' => $datos->count,
            'estado' => 200,
        ]);
    }

    /**
     * Conciliación
     *
     * @param int $id
     * @return JsonResponse
     */
    public function getConciliacion($id): JsonResponse
    {
        $orden = DB::table('ordenes_ejecutadas')
            ->where('adaptation_date_id', $id)
            ->where('proceso', 'eject')
            // ->where('estado', '100')
            ->first();

        if ($orden) {
            $ada_date = DB::table('adaptation_dates')
                ->where('id', $id)
                ->first();

            // maestra sin bom
            if (strtolower($orden->requiere_bom) == '0') {
                return response()->json([
                    'orden' => [
                        'orden_ejecutada' => $orden->id,
                        'adaptation_date_id' => $orden->adaptation_date_id,
                        'number_order' => $orden->number_order,
                        'descripcion_maestra' => $orden->descripcion_maestra,
                    ],
                    'conciliacion' => [
                        'codart' => $ada_date->codart,
                        'desart' => '',  // no existe el campo desart, en la base de datos
                        'quantityToProduce' => $ada_date->quantityToProduce,
                    ],
                    'estado' => 200,
                ]);
            }

            // maestra con bom
            $ingredientes = json_decode(json_decode($ada_date->ingredients))[0];
            return response()->json([
                'orden' => [
                    'orden_ejecutada' => $orden->id,
                    'adaptation_date_id' => $orden->adaptation_date_id,
                    'number_order' => $orden->number_order,
                    'descripcion_maestra' => $orden->descripcion_maestra,
                ],
                'conciliacion' => [
                    'codart' => $ingredientes->codart,
                    'desart' => $ingredientes->desart,
                    'quantityToProduce' => $ingredientes->teorica,
                ],
                'estado' => 200,
            ]);
        }

        return response()->json([
            'orden' => null,
            'estado' => 200,
        ]);
    }

    /**
     * Guardar conciliacion
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function guardar_conciliacion(
        Request $request
    ): JsonResponse {
        try {
            $data = $request->all();
            Conciliaciones::create($data);

            return response()->json([
                'message' => 'ok',
                'estado' => 200,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al guardar el formulario | ' . $e->getMessage(),
                'estado' => 500,
            ]);
        }
    }

    /**
     * Guardar formulario
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function guardar_formulario(
        Request $request
    ): JsonResponse {
        try {
            $data = $request->all();
            $id = $data['id'];
            $forms = $data['forms'];
            $user = $data['user'];

            // Validar si existe la fase
            ActividadesEjecutadas::where('id', $id)->update([
                'forms' => $forms,
                'user' => $user,
                'estado_form' => true,
                'created_at' => Carbon::now('America/Bogota'),
                'updated_at' => Carbon::now('America/Bogota'),
            ]);
            return response()->json([
                'message' => 'Formulario guardado correctamente',
                'estado' => 200,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al guardar el formulario | ' . $e->getMessage(),
                'estado' => 500,
            ]);
        }
    }

    /**
     * Restablecer orden
     *
     * @param int $id
     * @return JsonResponse
     */
    public function restablecerOrden($id): JsonResponse
    {
        // 1. Busca la última orden ejecutada con ese adaptation_date_id y estado = 100
        $orden = OrdenesEjecutadas::where('adaptation_date_id', $id)
            ->where('estado', '100')
            ->first();
        
        // 2. Busca la actividad con estado_form = false y phase_type = Procesos
        $actividad = ActividadesEjecutadas::where('adaptation_date_id', $id)
            ->where('phase_type', 'Procesos')
            ->where('estado_form', false)
            ->first();

        // 2. Si existe una actividad con estado_form = false y phase_type = Procesos...
        if ($orden && $actividad) {
            // 3. Marca todas las actividades de la orden como no ejecutadas
            ActividadesEjecutadas::where('adaptation_date_id', $id)->update([
                'estado_form' => true,
            ]);

            // 4. clona/crea las actividades de esa orden
            $fases = $this->crear_actividades_orden($id, $orden);

            // 5. Devuelve respuesta JSON
            return response()->json([
                'message' => 'Orden restablecida correctamente',
                'estado' => 200,
            ]);
        }

        // 5. Devuelve respuesta JSON
        return response()->json([
            'message' => 'Error, no se puede restabler orden',
            'estado' => -11500,
        ]);
    }

    /**
     * Crear Orden de acondicionamiento en la tabla OrdenesEjecutadas
     *
     * @param int $id
     * @return object
     */
    private function crear_orden_acondicionamiento(
        $id
    ): object {
        // Obtener Orden de acondicionamiento
        $acondicionamiento = DB::table('adaptations as ada')
            ->join('adaptation_dates as ada_date', 'ada.id', '=', 'ada_date.adaptation_id')
            ->join('maestras as mae', 'mae.id', '=', 'ada.master')
            ->join('clients as cli', 'cli.id', '=', 'ada.client_id')
            ->join('factories as fac', 'fac.id', '=', 'ada.factory_id')
            ->where('ada_date.id', $id)
            ->select(
                'ada_date.id as adaptation_date_id',
                'ada.id as adaptation_id',
                'ada.number_order',
                'ada.master as maestra_id',
                'mae.descripcion as descripcion_maestra',
                'mae.requiere_bom',
                'ada_date.line as linea_produccion',
                'mae.type_stage as maestra_fases_fk',
                'ada_date.status_dates',
                'cli.name as client_name',
                'fac.name as factory_name',
                'ada_date.quantityToProduce',
            )
            ->first();

        // Disparar evento si no existen lineas de produccion
        if (count(json_decode($acondicionamiento->linea_produccion)) < 1) {
            throw new \Exception('No existen lineas de produccion');
        }

        // Crear orden en la tabla OrdenesEjecutadas
        $acondicionamiento = OrdenesEjecutadas::create([
            'id' => null,
            'adaptation_date_id' => $acondicionamiento->adaptation_date_id,
            'adaptation_id' => $acondicionamiento->adaptation_id,
            'maestra_id' => $acondicionamiento->maestra_id,
            'requiere_bom' => $acondicionamiento->requiere_bom,
            'number_order' => $acondicionamiento->number_order,
            'descripcion_maestra' => $acondicionamiento->descripcion_maestra,
            'maestra_fases_fk' => $acondicionamiento->maestra_fases_fk,
            'linea_produccion' => $acondicionamiento->linea_produccion,
            'cliente' => $acondicionamiento->client_name,
            'planta' => $acondicionamiento->factory_name,
            'cantidad_producir' => $acondicionamiento->quantityToProduce,
        ]);

        // Actualizar estado de la adaptation_dates
        AdaptationDate::where('id', $acondicionamiento->adaptation_date_id)->update([
            'status_dates' => 'En ejecución',
        ]);

        return $acondicionamiento;
    }

    /**
     * Crear actividades de la orden ejecutada
     *
     * @param int $id
     * @return array
     */
    private function crear_actividades_orden(
        $id,
        $orden
    ): array {
        // insertar lineas de fases
        $fases = $this->generar_componentes(DB::table('ordenes_ejecutadas as ada')
            ->where('ada.adaptation_date_id', $id)
            ->where('ada.proceso', 'eject')
            ->join('stages as std', function ($join) {
                $join->on(
                    DB::raw(
                        "FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                    (ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"
                    ),
                    '>',
                    DB::raw('0')
                );
            })
            ->where('std.phase_type', '!=', 'Conciliación')
            ->select(
                'std.id',
                'std.description as descripcion',
                'std.phase_type',
                'std.repeat_line',
                DB::raw("FIND_IN_SET(std.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                    (ada.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')) as posicion")
            )
            ->orderByRaw('posicion ASC')
            ->get(), $orden);

        // crear actividades de la orden ejecutada
        foreach ($fases as $fase) {
            ActividadesEjecutadas::create([
                'orden_ejecutada' => $fase[0]->orden_ejecutada,
                'adaptation_date_id' => $fase[0]->adaptation_date_id,
                'adaptation_id' => $fase[0]->adaptation_id,
                'fases_fk' => $fase[0]->fases_fk,
                'description_fase' => $fase[0]->description_fase ?? '',
                'phase_type' => $fase[0]->phase_type ?? '',
                'linea' => $fase[0]->linea,
                'repeat_line' => $fase[0]->repeat_line,
                'forms' => json_encode($fase)
            ]);
        }

        // Obtener solo las fases de planificación
        $linea_fases = DB::table('actividades_ejecutadas as ada')
            ->where('ada.adaptation_date_id', $id)
            ->get();
        return $fases;
    }

    /**
     * Confirmar orden
     *
     * @param int $id
     * @return int
     */
    private function confirmar_orden(
        $id
    ): int {
        $conciliacion = Conciliaciones::where('adaptation_date_id', $id)->first();
        if ($conciliacion) {
            // Actualizar ActividadesEjecutadas
            OrdenesEjecutadas::where('adaptation_date_id', $id)->update([
                'estado' => '11500',
            ]);

            // datos de la adaptacion
            AdaptationDate::where('id', $id)->update([
                'status_dates' => 'Ejecutado',
            ]);
            return 11500;
        }
        return 100;
    }

    /**
     * Generar componentes de las actividades
     *
     * @param array $fases
     * @param object $ordenes
     * @return array
     */
    private function generar_componentes(
        $fases,
        $orden
    ): array {
        // obtener actividades segun la fase
        $acom = [];
        $lineas = json_decode($orden->linea_produccion, true);
        foreach ($lineas as $linea) {
            // obtener actividades de la fase
            $actividades = [];
            foreach ($fases->toArray() as $count => $fase) {
                // verificar si la fase es Proceso
                if ($fase->phase_type == 'Procesos') {
                    $ref_act = DB::table('adaptation_dates as ada')
                        ->where('ada.id', $orden->adaptation_date_id)
                        ->select(
                            'ada.activities',
                        )
                        ->first();
                    $ref_act->activities = $ref_act->activities ?? [];
                    foreach (json_decode($ref_act->activities, true) as $item) {
                        if ($item['id'] == $linea) {
                            $actividades = DB::table('activities as atc')
                                ->whereIn('atc.id', $item['activities'])  // Filtra directamente los IDs del array
                                ->select(
                                    'atc.id as id_activitie',
                                    'atc.description as descripcion_activitie',
                                    'atc.config',
                                    'atc.binding'
                                )
                                ->get();
                        }
                    }
                } else {
                    // obtener lista si la actividades
                    $actividades = DB::table('stages as std')
                        ->join('activities as atc', function ($join) {
                            $join->on(
                                DB::raw(
                                    "FIND_IN_SET(atc.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                                    (std.activities, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"
                                ),
                                '>',
                                DB::raw('0')
                            );
                        })
                        ->where('std.id', $fase->id)
                        ->where(DB::raw('LOWER(std.phase_type)'), '!=', DB::raw("LOWER('Control')"))
                        ->where(DB::raw('LOWER(std.phase_type)'), '!=', DB::raw("LOWER('Planificación')"))
                        ->where(DB::raw('LOWER(std.phase_type)'), '!=', DB::raw("LOWER('Conciliación')"))
                        ->where(DB::raw('LOWER(std.phase_type)'), '!=', DB::raw("LOWER('Procesos')"))
                        ->where('std.repeat_line', 1)
                        ->select(
                            'atc.id as id_activitie',
                            'atc.description as descripcion_activitie',
                            'atc.config',
                            'atc.binding',
                        )
                        ->get();
                }
                $acom = $this->armar_actividades($actividades, $orden, $linea, $fase, $count, $acom);
            }
        }

        // armar actividades de planificación o conciliación
        $actividades = [];
        foreach ($fases->toArray() as $count => $fase) {
            if (
                $fase->phase_type == 'Planificación' ||
                $fase->phase_type == 'Conciliación' ||
                $fase->phase_type == 'Actividades'
            ) {
                // obtener lista si la actividades especificos
                $actividades = DB::table('stages as std')
                    ->join('activities as atc', function ($join) {
                        $join->on(
                            DB::raw(
                                "FIND_IN_SET(atc.id, REPLACE(REPLACE(REPLACE(REPLACE(COALESCE
                             (std.activities, ''), '[', ''), ']', ''), ' ', ''), '\"', ''))"
                            ),
                            '>',
                            DB::raw('0')
                        );
                    })
                    ->where('std.id', $fase->id)
                    ->whereIn('std.phase_type', ['Planificación', 'Conciliación', 'Actividades'])
                    // ->where(function ($query) {
                    //     $query
                    //         ->where(DB::raw('LOWER(std.phase_type)'), '=', DB::raw("LOWER('Planificación')"))
                    //         ->orWhere(DB::raw('LOWER(std.phase_type)'), '=', DB::raw("LOWER('Conciliación')"))
                    //         ->orWhere(function ($q) {
                    //             $q->whereRaw(DB::raw('LOWER(std.phase_type)'), '=', DB::raw("LOWER('Actividades')"))
                    //               ->where(DB::raw('std.repeat_line'), '=', DB::raw(0));
                    //         });
                    // })
                    ->where(DB::raw('std.repeat_line'), '=', DB::raw(0))
                    ->select(
                        'atc.id as id_activitie',
                        'atc.description as descripcion_activitie',
                        'atc.config',
                        'atc.binding',
                    )
                    ->get();
                $acom = $this->armar_actividades($actividades, $orden, 0, $fase, $count, $acom);
            }
        }
        // echo gettype($acom) . "\n" . json_encode($acom);
        // exit;
        return $acom;
    }

    /**
     * Armar actividades
     *
     * @param array $actividades
     * @param object $orden
     * @param int $linea
     * @param object $fase
     * @param int $count
     * @param array $acom
     * @return array
     */
    private function armar_actividades(
        $actividades,
        $orden,
        $linea,
        $fase,
        $count,
        $acom
    ): array {
        if (count($actividades->toArray()) > 0) {
            $actividades = $actividades->toArray();
            foreach ($actividades as $key => $value) {
                $clave = implode('', [
                    $orden->id,
                    $orden->adaptation_date_id,
                    $orden->adaptation_id,
                    $linea,
                    $fase->id,
                    $value->id_activitie,
                    $count,
                    $key,
                ]);

                $value->orden_ejecutada = $orden->id;
                $value->adaptation_date_id = $orden->adaptation_date_id;
                $value->adaptation_id = $orden->adaptation_id;
                $value->maestra_id = $orden->maestra_id;
                $value->fases_fk = $fase->id;
                $value->linea = $linea > 0 ? $linea : 0;
                $value->repeat_line = $fase->repeat_line;
                $value->description_fase = $fase->descripcion ?? '';
                $value->phase_type = $fase->phase_type ?? '';
                $value->actividad_fk = $value->id_activitie;
                $value->secuencia = $count;
                $value->clave = $clave;
                $value->valor = '';
                $value->copia = 'no';
                $actividades[$key] = $value;
            }
            $acom[] = $actividades;
        }
        return $acom;
    }
}
