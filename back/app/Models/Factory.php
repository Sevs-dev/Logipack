<?php

namespace App\Models;

use App\Traits\AdminAuditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Factory extends Model
{
    use HasFactory;
    use AdminAuditable;
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