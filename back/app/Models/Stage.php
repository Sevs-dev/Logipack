<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stage extends Model
{
    use HasFactory;
    
    protected $guarded = [];
    // Aseguramos que Laravel decodifique automáticamente el campo activities
    protected $casts = [
        'activities' => 'array',
    ];

    // Método para obtener las actividades como colección
    public function getActivitiesAttribute()
    {
        $activityIds = $this->attributes['activities'] ?? '[]';

        // Si viene como string, decodificamos
        if (is_string($activityIds)) {
            $activityIds = json_decode($activityIds, true) ?: [];
        }

        return Activitie::whereIn('id', $activityIds)->get();
    }
}