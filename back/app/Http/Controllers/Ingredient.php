<?php

namespace App\Http\Controllers;

use App\Models\Ingredients;
use Illuminate\Http\Request;

class Ingredient extends Controller
{ // Obtener todos los ingredientes activos
    public function index()
    {
        $ingredients = Ingredients::where('status', true)->get(); // Ahora usa la columna status
        return response()->json($ingredients);
    }

    // Obtener un ingrediente por ID
    public function show($id)
    {
        $ingredient = Ingredients::find($id);

        if (!$ingredient || !$ingredient->isActive()) {
            return response()->json(['error' => 'Ingrediente no encontrado o desactivado'], 404);
        }

        return response()->json($ingredient);
    }

    // Crear un nuevo ingrediente
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string',
            'proveedor' => 'required|string',
            'serial' => 'required|string',
            // Otros campos según necesidad
        ]);

        $data = $request->all();

        $ingredient = Ingredients::create([
            'data' => $data,
            'status' => true, // Activado por defecto
        ]);

        return response()->json($ingredient, 201);
    }

    // Actualizar un ingrediente
    public function update(Request $request, $id)
    {
        $ingredient = Ingredients::find($id);

        if (!$ingredient) {
            return response()->json(['error' => 'Ingrediente no encontrado'], 404);
        }

        $request->validate([
            'nombre' => 'string',
            'proveedor' => 'string',
            'serial' => 'string',
            // Otros campos según necesidad
        ]);

        $data = array_merge($ingredient->data, $request->all());
        $ingredient->update(['data' => $data]);

        return response()->json($ingredient);
    }

    // Desactivar un ingrediente
    public function deactivate($id)
    {
        $ingredient = Ingredients::find($id);

        if (!$ingredient) {
            return response()->json(['error' => 'Ingrediente no encontrado'], 404);
        }

        $ingredient->update(['status' => false]); // Ahora se actualiza la columna status

        return response()->json(['message' => 'Ingrediente desactivado']);
    }
}