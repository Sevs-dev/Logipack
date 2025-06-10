<?php

namespace App\Models;

use App\Traits\AdminAuditable;
use Illuminate\Database\Eloquent\Model;

class Machinery extends Model
{
    use AdminAuditable;
    protected $guarded = [];

    public function factory()
    {
        return $this->belongsTo(Factory::class);
    }
}