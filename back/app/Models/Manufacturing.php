<?php

namespace App\Models;

use App\Traits\AdminAuditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Manufacturing extends Model
{
    use HasFactory;
    use AdminAuditable;
    protected $guarded = [];

    protected $casts = [ 
        'products' => 'array',
    ];
    
    // Relación muchos a uno: Una línea de manufactura pertenece a una fábrica
    public function factory()
    {
        return $this->belongsTo(Factory::class);
    }

    public function products()
    {
        return $this->belongsToMany(Products::class, 'manufacturing_product'); // tabla intermedia
    }
}