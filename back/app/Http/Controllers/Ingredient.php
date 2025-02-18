<?php

namespace App\Http\Controllers;
use App\Models\Ingredients;
use App\Models\IngredientData;
use Illuminate\Http\Request;

class Ingredient extends Controller
{
    // Mostrar todos los ingredientes
    public function index()
    {
        $ingredients = Ingredients::all();
        return response()->json($ingredients);
    }

    // Mostrar un ingrediente específico por ID
    public function show($id)
    {
        $ingredient = Ingredients::find($id);

        if (!$ingredient) {
            return response()->json(['error' => 'Ingrediente no encontrado'], 404);
        }

        return response()->json($ingredient);
    }

    // Crear un nuevo ingrediente
    public function store(Request $request)
    {
        // Validar los datos de la solicitud
        $request->validate([
            'nombre' => 'required|string',
            'proveedor' => 'required|string',
            'serial' => 'required|string',
            // Otros campos necesarios
        ]);

        // Crear un nuevo objeto IngredientData
        $data = new IngredientData($request->all());

        // Crear el ingrediente en la base de datos
        $ingredient = new Ingredients();
        $ingredient->data = $data;
        $ingredient->save();

        return response()->json($ingredient, 201);
    }

    // Actualizar un ingrediente existente
    public function update(Request $request, $id)
    {
        $ingredient = Ingredients::find($id);

        if (!$ingredient) {
            return response()->json(['error' => 'Ingrediente no encontrado'], 404);
        }

        // Validar los datos de la solicitud
        $request->validate([
            'nombre' => 'required|string',
            'proveedor' => 'required|string',
            'serial' => 'required|string',
            // Otros campos necesarios
        ]);

        // Actualizar los datos
        $data = new IngredientData($request->all());
        $ingredient->data = $data;
        $ingredient->save();

        return response()->json($ingredient);
    }

    // Eliminar un ingrediente
    public function destroy($id)
    {
        $ingredient = Ingredients::find($id);

        if (!$ingredient) {
            return response()->json(['error' => 'Ingrediente no encontrado'], 404);
        }

        $ingredient->delete();
        return response()->json(['message' => 'Ingrediente eliminado']);
    }
}

