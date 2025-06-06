<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Factory extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function manufacturings()
    {
        return $this->hasMany(Manufacturing::class);
    }

    public function machineries()
    {
        return $this->hasMany(Machinery::class);
    }
}