<?php

namespace App\Models;

use App\Traits\AdaptationAuditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

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
        Log::info("🔍 Buscando planificación con ID: {$id}");

        $adaptationDate = self::with('adaptation.maestra')->find($id);
        if (!$adaptationDate) {
            Log::warning("⚠️ No se encontró adaptación con ID: {$id}");
            return null;
        }

        $adaptation = $adaptationDate->adaptation;
        if (!$adaptation) {
            Log::warning("⚠️ No se encontró 'adaptation' asociada al ID: {$id}");
            return null;
        }

        $maestra = $adaptation->maestra;
        if (!$maestra) {
            Log::warning("⚠️ No se encontró 'maestra' asociada a la adaptación ID: {$adaptation->id}");
            return null;
        }

        // Type Stage
        $typeStagesRaw = $maestra->type_stage ?? '[]';
        Log::info("📦 type_stage (raw):", ['raw' => $typeStagesRaw]);

        if (is_string($typeStagesRaw)) {
            $decoded = json_decode($typeStagesRaw, true) ?: [];
            $typeStages = isset($decoded['raw']) ? $decoded['raw'] : $decoded;
        } elseif (is_array($typeStagesRaw)) {
            $typeStages = $typeStagesRaw;
        } else {
            $typeStages = [];
        }
        Log::info("✅ type_stage (decodificado):", $typeStages);

        // Type Acondicionamiento
        $typeAcomRaw = $maestra->type_acondicionamiento ?? '[]';
        Log::info("📦 type_acondicionamiento (raw):", ['raw' => $typeAcomRaw]);

        if (is_string($typeAcomRaw)) {
            $decodedAcom = json_decode($typeAcomRaw, true) ?: [];
            $typeAcom = isset($decodedAcom['raw']) ? $decodedAcom['raw'] : $decodedAcom;
        } elseif (is_array($typeAcomRaw)) {
            $typeAcom = $typeAcomRaw;
        } else {
            $typeAcom = [];
        }
        Log::info("✅ type_acondicionamiento (decodificado):", $typeAcom);

        $stages = Stage::whereIn('id', $typeStages)
            ->where('phase_type', 'Procesos')
            ->get();
        Log::info("📌 Stages encontrados:", $stages->pluck('id', 'description')->toArray());

        $lineaAcoms = LineaTipoAcondicionamiento::whereIn('tipo_acondicionamiento_id', $typeAcom)->get();
        Log::info("📌 Líneas de acondicionamiento encontradas:", $lineaAcoms->pluck('id', 'tipo_acondicionamiento_id')->toArray());

        $result = collect();

        foreach ($stages as $stage) {
            $activityIds = $stage->activities->pluck('id')->toArray();
            Log::info("🧩 Actividades para Stage {$stage->id} - {$stage->description}:", $activityIds);

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

        foreach ($lineaAcoms as $linAcom) {
            $faseIds = json_decode($linAcom->fase ?? '[]', true);
            if (!is_array($faseIds)) {
                $faseIds = [];
            }

            Log::info("🔄 Recorriendo fases de línea de acondicionamiento {$linAcom->tipo_acondicionamiento_id}:", $faseIds);

            foreach ($faseIds as $faseId) {
                $stage = $stages->firstWhere('id', $faseId);
                if ($stage) {
                    $result->push([
                        'ID_ADAPTACION' => $adaptation->id,
                        'ID_MAESTRA' => $maestra->id,
                        'ID_TIPO_ACOM' => $linAcom->tipo_acondicionamiento_id,
                        'ID_FASE' => $stage->id,
                        'ID_ACTIVITIES' => $stage->activities->pluck('id')->toArray(),
                        'DESCRIPCION_FASE' => $stage->description,
                        'ES_EDITABLE' => $linAcom->editable,
                    ]);
                }
            }
        }

        Log::info("🗃️ Resultado sin agrupar (raw):", $result->toArray());

        $grouped = $result->groupBy('ID_FASE')->map(function ($items) {
            $esEditableMax = collect($items)->max('ES_EDITABLE');
            $countTipoAcom = collect($items)->whereNotNull('ID_TIPO_ACOM')->count();

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

        Log::info("✅ Resultado final agrupado:", $grouped->toArray());

        return $grouped;
    }
}