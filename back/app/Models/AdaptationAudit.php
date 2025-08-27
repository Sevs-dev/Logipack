<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdaptationAudit extends Model
{
    protected $table = 'audits';
    protected $guarded = [];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];
}