<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\IngredientData;

class Ingredients extends Model
{
    protected $fillable = ['data']; // Campo JSON en la base de datos

    // Getter para acceder a los datos como un objeto
    public function getDataAttribute($value)
    {
        // Convertir los datos JSON a un objeto IngredientData
        return new IngredientData(json_decode($value, true));
    }

    // Setter para guardar los datos como JSON
    public function setDataAttribute($value)
    {
        // Convertir el objeto a array y almacenarlo como JSON
        $this->attributes['data'] = json_encode($value->toArray());
    }
}