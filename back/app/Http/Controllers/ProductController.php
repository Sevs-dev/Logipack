<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Products;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    // Método para obtener todos los registros de product y devolverlos en formato JSON
    public function getproduct(): JsonResponse
    {
        $product = Products::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('products as a2')
                    ->whereColumn('a2.reference_id', 'products.reference_id');
            })
            ->get();

        return response()->json($product, 200);
    }

    // Método para crear un nuevo product
    public function newproduct(Request $request): JsonResponse
    {
        // Se valida que el campo 'name' sea obligatorio, de tipo string y con máximo 255 caracteres
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'user' => 'string|nullable',
        ]);

        // Se crea un nuevo registro en la tabla product  
        // - Si no, se guarda un array vacío codificado a JSON.
        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();
        $product = Products::create($validatedData);

        // Se devuelve una respuesta JSON con un mensaje de éxito y el objeto product creado, usando el código HTTP 201 (Creado)
        return response()->json([
            'message' => 'Línea creada exitosamente',
            'product' => $product
        ], 201);
    }

    // Método para obtener un product específico por su ID
    public function productId($id): JsonResponse
    {
        // Se busca el product por el ID proporcionado
        $product = Products::find($id);

        // Si no se encuentra, se devuelve un mensaje de error con código 404 (No Encontrado)
        if (!$product) {
            return response()->json(['message' => 'product no encontrada'], 404);
        }

        // Si se encuentra, se devuelve el product en formato JSON
        return response()->json($product);
    }

    public function ProductName($name): JsonResponse
    {
        // Se busca el producto por su nombre
        $product = Products::where('name', $name)->first();

        // Si no se encuentra, se devuelve un mensaje de error con código 404
        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        // Se devuelve el producto encontrado en formato JSON
        return response()->json($product);
    }


    // Método para actualizar un product existente
    public function updateproduct(Request $request, $id): JsonResponse
    {
        // Se busca el product por el ID proporcionado
        $product = Products::find($id);

        // Si el product no existe, se retorna un mensaje de error con código 404
        if (!$product) {
            return response()->json(['message' => 'product no encontrada'], 404);
        }

        // Se valida que, si se envía, el campo 'name' sea de tipo string y tenga un máximo de 255 caracteres
        $validatedData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'user' => 'string|nullable',
        ]);

        // Crear nueva versión
        $newVersion = (int) $product->version + 1;

        $new = $product->replicate(); // duplica todos los atributos excepto la PK
        $new->version = $newVersion;
        $new->fill($validatedData);
        $new->reference_id = $product->reference_id ?? (string) Str::uuid();
        $new->active = true; // activamos la nueva versión
        $new->save();

        // Se devuelve una respuesta JSON con un mensaje de éxito y el product actualizado
        return response()->json([
            'message' => 'product actualizada correctamente',
            'product' => $product
        ]);
    }

    // Método para eliminar un product por su ID
    public function deleteproduct($id): JsonResponse
    {
        // Se busca el product por el ID proporcionado
        $product = Products::find($id);
        // Si no se encuentra, se devuelve un mensaje de error con código 404
        if (!$product) {
            return response()->json(['message' => 'product no encontrada'], 404);
        }
        // Se elimina el product de la base de datos
        $product->active = false;
        $product->save();
        // Se devuelve una respuesta JSON con un mensaje indicando que la eliminación fue exitosa
        return response()->json(['message' => 'product eliminada correctamente']);
    }
}