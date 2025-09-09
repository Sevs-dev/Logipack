<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Timer extends Model
{
    use HasFactory;
    protected $guarded = [];

     protected $casts = [
        'pause'      => 'boolean',
        'finish'     => 'boolean',
        'time'       => 'integer',
        'pause_time' => 'integer',
        'started_at' => 'datetime',
        'paused_at'  => 'datetime',
        'finished_at'=> 'datetime',
        'accumulated_pause_secs' => 'integer',
    ];

    public function timerControls()
    {
        return $this->hasMany(TimerControl::class);
    }
    public function ejecutada()
    {
        return $this->belongsTo(ActividadesEjecutadas::class, 'ejecutada_id');
    }
}
