<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Adaptation extends Model
{
    use HasFactory;

    protected $guarded = [];

    public $timestamps = false; 

    public function adaptations()
    {
        return $this->hasMany(AdaptationDate::class);
    }

    public function maestra()
    {
        return $this->belongsTo(Maestra::class, 'master');
    }
}