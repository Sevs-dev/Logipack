<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
// ⚠️ importa tu modelo de actividad
use App\Models\Activitie;

class Stage extends Model
{
    use Auditable, HasFactory;

    protected $guarded = [];

    // 1) CASTS: booleans reales en JSON y array para activities (ids)
    protected $casts = [
        'repeat'       => 'boolean',
        'alert'        => 'boolean',
        'can_pause'    => 'boolean',
        'status'       => 'boolean',
        'multi'        => 'boolean',
        'repeat_line'  => 'boolean',
        'active'       => 'boolean',
        'activities'   => 'array',   // almacenas ids en DB
        'version'      => 'integer',
        'repeat_minutes' => 'integer',
    ];

    // 2) MUTATORS: espejo status <-> active (sin recursión)
    public function setStatusAttribute($value): void
    {
        $b = (bool) $value;
        $this->attributes['status'] = $b;
        $this->attributes['active'] = $b;
    }

    public function setActiveAttribute($value): void
    {
        $b = (bool) $value;
        $this->attributes['active'] = $b;
        $this->attributes['status'] = $b;
    }

    // 3) (OPCIONAL) Scopes para reutilizar en el controller
    public function scopeOnlyActive($q, bool $only = true)
    {
        return $only ? $q->where('active', 1) : $q;
    }

    public function scopeLatestPerReference($q)
    {
        return $q->where(function ($q2) {
            $q2->whereNull('reference_id')
               ->orWhereIn('version', function ($sub) {
                   $sub->selectRaw('MAX(version)')
                       ->from('stages as a2')
                       ->whereColumn('a2.reference_id', 'stages.reference_id');
               });
        });
    }

    // 4) Si quieres devolver también las ACTIVIDADES como modelos:
    //    Deja 'activities' como array de IDs (para guardar simple)
    //    y expón otra propiedad derivada:
    protected $appends = ['activities_models'];

    public function getActivitiesModelsAttribute()
    {
        $ids = $this->attributes['activities'] ?? '[]';
        if (is_string($ids)) {
            $ids = json_decode($ids, true) ?: [];
        }
        if (!is_array($ids) || empty($ids)) return [];
        return Activitie::whereIn('id', $ids)->get();
    }

    // ⚠️ Si mantienes ESTE accessor, ya no sobrescribas 'activities' original
    // (Evita un getActivitiesAttribute() que rompa el cast a array)
}
