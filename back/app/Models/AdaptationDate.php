<?php

namespace App\Models;

use App\Traits\AdaptationAuditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdaptationDate extends Model
{
    use HasFactory;
    

    protected $guarded = [];

    protected $casts = [
        'activities' => 'array',
        // otros casts...
    ];

    // ✅ Relación con Adaptation (asumiendo que tiene adaptation_id)
    public function adaptation()
    {
        return $this->belongsTo(Adaptation::class);
    }

    // ✅ Relación con Cliente (asumiendo que tiene client_id)
    public function client()
    {
        return $this->belongsTo(Clients::class);
    }

    // ✅ Relación con Maestra (clave foránea 'master')
    public function maestra()
    {
        return $this->belongsTo(Maestra::class, 'master');
    }

    public static function getPlanByIdEloquent($id)
    {
        $adaptationDate = self::with('adaptation.maestra')->find($id);
        if (!$adaptationDate) return null;

        $adaptation = $adaptationDate->adaptation;
        if (!$adaptation) return null;

        $maestra = $adaptation->maestra;
        if (!$maestra) return null;

        // Para type_stage
        $typeStagesRaw = $maestra->type_stage ?? '[]';
        if (is_string($typeStagesRaw)) {
            $typeStages = json_decode($typeStagesRaw, true) ?: [];
        } elseif (is_array($typeStagesRaw)) {
            $typeStages = $typeStagesRaw;
        } else {
            $typeStages = [];
        }

        // Para type_acondicionamiento
        $typeAcomRaw = $maestra->type_acondicionamiento ?? '[]';
        if (is_string($typeAcomRaw)) {
            $typeAcom = json_decode($typeAcomRaw, true) ?: [];
        } elseif (is_array($typeAcomRaw)) {
            $typeAcom = $typeAcomRaw;
        } else {
            $typeAcom = [];
        }

        $stages = Stage::whereIn('id', $typeStages)
            ->where('phase_type', 'Procesos')
            ->get();

        $lineaAcoms = LineaTipoAcondicionamiento::whereIn('tipo_acondicionamiento_id', $typeAcom)->get();

        $result = collect();

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


        foreach ($lineaAcoms as $linAcom) {
            $faseIds = json_decode($linAcom->fase ?? '[]', true);
            if (!is_array($faseIds)) {
                $faseIds = [];
            }
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

        // Agrupamos solo por ID_FASE para que no haya repeticiones
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
                // Si ni ES_EDITABLE ni ES_EDITABLE_2 son 1, vacía las actividades
                'ID_ACTIVITIES' => ($esEditableMax === 1 || $esEditable2 === 1) ? $allActivityIds : [],
            ];
        })->values();


        return $grouped;
    }
}