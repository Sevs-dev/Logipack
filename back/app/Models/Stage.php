<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stage extends Model
{
    use Auditable;
    use HasFactory;

    protected $guarded = [];

    // Casts que SÍ necesitás
    protected $casts = [
        // OJO: este cast aplica al valor crudo del atributo; el accessor puede devolver otra cosa
        'activities'     => 'array',
        'repeat'         => 'boolean',
        'repeat_line'    => 'boolean',
        'alert'          => 'boolean',
        'can_pause'      => 'boolean',
        'status'         => 'boolean',
        'multi'          => 'boolean',
        'active'         => 'boolean',
        'repeat_minutes' => 'integer',
    ];

    // 👉 si querés que siempre salga también el array de IDs en JSON:
    protected $appends = ['activities_ids'];

    /**
     * ⚠️ Compat: Mantiene 'activities' como COLECCIÓN expandida
     * y respeta el ORDEN del array de IDs guardado.
     * Planificación seguira funcionando igual.
     */
    public function getActivitiesAttribute($value)
    {
        // IDs ya casteados a array (por $casts). Si no, usa el raw.
        $ids = is_array($value)
            ? $value
            : (is_string($value) ? (json_decode($value, true) ?: []) : []);

        if (empty($ids)) {
            // Devolvemos una colección vacía para compat con código que espera colección
            return collect();
        }

        // MySQL/MariaDB: preserva orden con FIELD. Para Postgres ver nota más abajo.
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        return Activitie::whereIn('id', $ids)
            ->orderByRaw("FIELD(id, $placeholders)", $ids)
            ->get();
    }

    /**
     * IDs crudos tal cual DB (para edición/guardar).
     * Esto evita que tengas que “desexpandir” nada.
     */
    public function getActivitiesIdsAttribute(): array
    {
        // Usa el valor ORIGINAL de la columna (sin accessor)
        $raw = $this->getRawOriginal('activities');

        if (is_array($raw)) return array_values(array_unique(array_map('intval', $raw)));

        if (is_string($raw)) {
            $arr = json_decode($raw, true);
            if (is_array($arr)) {
                return array_values(array_unique(array_map('intval', $arr)));
            }
        }

        return [];
    }
}
