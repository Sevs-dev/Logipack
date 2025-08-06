<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Timer extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function timerControls()
    {
        return $this->hasMany(TimerControl::class);
    }

    public function ejecutada()
    {
        return $this->belongsTo(ActividadesEjecutadas::class, 'ejecutada_id');
    }
}