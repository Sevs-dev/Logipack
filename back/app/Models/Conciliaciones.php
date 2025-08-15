<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conciliaciones extends Model
{
    //
    protected $guarded = [];

    public function adaptationDate()
    {
        return $this->belongsTo(AdaptationDate::class, 'adaptation_date_id');
    }
}
