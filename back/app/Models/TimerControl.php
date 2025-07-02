<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TimerControl extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'data' => 'array',
    ];
}