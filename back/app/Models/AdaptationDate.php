<?php

namespace App\Models;

use App\Traits\AdaptationAuditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdaptationDate extends Model
{
    use HasFactory;

    // ✅ Permitir asignación masiva
    protected $guarded = [];

    // ✅ Convertir 'activities' automáticamente a array
    protected $casts = [
        'activities' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relaciones
    |--------------------------------------------------------------------------
    */

    // 🔗 Relación con la tabla Adaptation
    public function adaptation()
    {
        return $this->belongsTo(Adaptation::class);
    }

    // 🔗 Relación con la tabla Clients (cliente)
    public function client()
    {
        return $this->belongsTo(Clients::class);
    }

    // 🔗 Relación con la tabla Maestra (clave foránea 'master')
    public function maestra()
    {
        return $this->belongsTo(Maestra::class, 'master');
    }

    // 🔗 Relación con la tabla OrdenesEjecutadas
    public function ordenadas()
    {
        return $this->belongsTo(OrdenesEjecutadas::class);
    }

    // 🔗 Relación con la tabla Actividades Ejecutadas
    public function actividadesEjecutadas()
    {
        return $this->hasMany(ActividadesEjecutadas::class, 'adaptation_date_id');
    }

    // 🔗 Relación con líneas de manufactura
    public function lines()
    {
        return $this->hasMany(Manufacturing::class, 'id', 'line');
    }

    // 🔗 Relación con máquinas
    public function machines()
    {
        return $this->hasMany(Factory::class, 'id', 'machine');
    }

    // 🔗 Relación con usuarios asignados
    public function assignedUsers()
    {
        return $this->hasMany(User::class, 'id', 'users');
    }


    /*
    |--------------------------------------------------------------------------
    | Método personalizado para obtener fases y actividades del plan
    |--------------------------------------------------------------------------
    */
    public static function getPlanByIdEloquent($id)
    {
        // ✅ Cargar adaptación con su maestra
        $adaptationDate = self::with('adaptation.maestra')->find($id);
        if (!$adaptationDate) return null;

        $adaptation = $adaptationDate->adaptation;
        if (!$adaptation) return null;

        $maestra = $adaptation->maestra;
        if (!$maestra) return null;

        // ✅ Decodificar type_stage
        $typeStagesRaw = $maestra->type_stage ?? '[]';
        if (is_string($typeStagesRaw)) {
            $typeStages = json_decode($typeStagesRaw, true) ?: [];
        } elseif (is_array($typeStagesRaw)) {
            $typeStages = $typeStagesRaw;
        } else {
            $typeStages = [];
        }

        // ✅ Decodificar type_acondicionamiento
        $typeAcomRaw = $maestra->type_acondicionamiento ?? '[]';
        if (is_string($typeAcomRaw)) {
            $typeAcom = json_decode($typeAcomRaw, true) ?: [];
        } elseif (is_array($typeAcomRaw)) {
            $typeAcom = $typeAcomRaw;
        } else {
            $typeAcom = [];
        }

        // ✅ Obtener las fases (stages) de tipo 'Procesos'
        $stages = Stage::whereIn('id', $typeStages)
            ->where('phase_type', 'Procesos')
            ->get();

        // ✅ Obtener líneas de tipo de acondicionamiento
        $lineaAcoms = LineaTipoAcondicionamiento::whereIn('tipo_acondicionamiento_id', $typeAcom)->get();

        $result = collect();

        /*
        |--------------------------------------------------------------------------
        | Recorrer stages de procesos y agregar al resultado
        |--------------------------------------------------------------------------
        */
        foreach ($stages as $stage) {
            $activityIds = $stage->activities->pluck('id')->toArray();

            $result->push([
                'ID_ADAPTACION' => $adaptation->id,
                'ID_MAESTRA' => $maestra->id,
                'ID_TIPO_ACOM' => null,
                'ID_FASE' => $stage->id,
                'ID_ACTIVITIES' => $activityIds,
                'DESCRIPCION_FASE' => $stage->description,
                'ES_EDITABLE' => 0,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Recorrer líneas de acondicionamiento y agregar fases adicionales
        |--------------------------------------------------------------------------
        */
        foreach ($lineaAcoms as $linAcom) {
            $faseIds = json_decode($linAcom->fase ?? '[]', true);
            if (!is_array($faseIds)) $faseIds = [];

            foreach ($faseIds as $faseId) {
                $stage = $stages->firstWhere('id', $faseId);
                if ($stage) {
                    $result->push([
                        'ID_ADAPTACION' => $adaptation->id,
                        'ID_MAESTRA' => $maestra->id,
                        'ID_TIPO_ACOM' => $linAcom->tipo_acondicionamiento_id,
                        'ID_FASE' => $stage->id,
                        'ID_ACTIVITIES' => $activityIds,
                        'DESCRIPCION_FASE' => $stage->description,
                        'ES_EDITABLE' => $linAcom->editable,
                    ]);
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Agrupar por ID_FASE para evitar duplicados y combinar datos
        |--------------------------------------------------------------------------
        */
        $grouped = $result->groupBy('ID_FASE')->map(function ($items) {
            $esEditableMax = collect($items)->max('ES_EDITABLE');
            $countTipoAcom = collect($items)->whereNotNull('ID_TIPO_ACOM')->count();

            // Unificar actividades únicas
            $allActivityIds = collect($items)
                ->flatMap(fn($i) => $i['ID_ACTIVITIES'])
                ->unique()
                ->values()
                ->all();

            $esEditable2 = $countTipoAcom === 0 ? 1 : $esEditableMax;

            return [
                'ID_ADAPTACION' => $items[0]['ID_ADAPTACION'],
                'ID_MAESTRA' => $items[0]['ID_MAESTRA'],
                'ID_TIPO_ACOM' => null,
                'ID_FASE' => $items[0]['ID_FASE'],
                'DESCRIPCION_FASE' => $items[0]['DESCRIPCION_FASE'],
                'ES_EDITABLE' => $esEditableMax,
                'ES_EDITABLE_2' => $esEditable2,
                'ID_ACTIVITIES' => ($esEditableMax === 1 || $esEditable2 === 1) ? $allActivityIds : [],
            ];
        })->values();

        return $grouped;
    }
}