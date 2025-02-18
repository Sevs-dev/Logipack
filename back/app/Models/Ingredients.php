<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredients extends Model
{
    protected $table = 'ingredients'; // Asegura que el nombre de la tabla sea correcto
    protected $guarded = []; // Permitir asignación masiva

    // Para manejar los datos como un array en JSON
    protected $casts = [
        'data' => 'array',
        'status' => 'boolean', // Nueva columna status como booleano

    ];

    // Método para obtener el campo 'status' directamente desde el JSON
    public function isActive()
    {
        return $this->data['status'] ?? true;
    }
}
