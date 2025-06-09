<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Maestra extends Model
{
    use Auditable;
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'type_stage' => 'array',
        'type_acondicionamiento' => 'array',
    ];
}