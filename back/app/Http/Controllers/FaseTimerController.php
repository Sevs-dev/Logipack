<?php

namespace App\Http\Controllers;

use App\Models\OrdenesEjecutadas;
use App\Models\ActividadesEjecutadas;
use App\Models\AdaptationDate;
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
        //  Consultar orden generada y su fase
        $ordenes = OrdenesEjecutadas::where('id', $response->orden_id)
            ->where('proceso', 'eject') 
            ->first();
        $maestra_fases_fk = $this->getActividades(DB::table('ordenes_ejecutadas as orden')
        ->crossJoin('stages as std')
        ->whereRaw("
            FIND_IN_SET(
                std.id,
                REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(orden.maestra_fases_fk, ''), '[', ''), ']', ''), ' ', ''), '\"', '')
            ) > 0
        ")
        ->where('orden.id', '=', $response->orden_id)
        ->whereRaw('LOWER(std.phase_type) = LOWER(?)', ['Control'])
        ->select(
            DB::raw('0 as tipo_acondicionamiento_id'),
            DB::raw('NULL as descripcion_tipo_acondicionamiento'),
            DB::raw('NULL as descripcion_linea_tipo_acondicionamiento'),
            'std.id as fases_fk',
            'std.description as description_fase',
            'std.phase_type',
            'std.repeat_line'
             
        )
        ->orderByRaw('posicion ASC')
        ->get(), $ordenes, $id);

        return response()->json([
            'message' => 'Estado de la fase de control pendiente',
            'estado' => 100,
            'acondicionamiento' => json_decode($ordenes, true),
            'maestra_fases_fk' => $maestra_fases_fk,
        ]);
    }


        /**
     * Funcion para obtener actividades
     * 
     * @param array $fases
     * @param object $ordenes
     * @return array
     */
    private function getActividades($fases, $ordenes, $id) : array 
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
            ->where(DB::raw('LOWER(std.phase_type)'), '=', DB::raw("LOWER('Control')"))
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
                                $id,
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
                        $id,
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
}
