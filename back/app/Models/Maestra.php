<?php

namespace App\Models;

use App\Models\Stage;

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

    public function getStagesAttribute()
    {
        $stageIds = $this->attributes['type_stage'] ?? '[]';

        if (is_string($stageIds)) {
            $stageIds = json_decode($stageIds, true) ?: [];
        }

        return Stage::whereIn('id', $stageIds)->get();
    }
}