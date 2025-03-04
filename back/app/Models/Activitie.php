<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activitie extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'config' => 'array', // Laravel convierte automáticamente el JSON en array
    ];
}