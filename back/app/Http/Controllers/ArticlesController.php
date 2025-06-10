<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Bom;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArticlesController extends Controller
{
    public function getArticlesByCoddiv($code)
    {
        try {
            // Llamada a la API con interpolación correcta de la variable
            $response = Http::get("http://129.146.161.23/BackEnd_Orion/lista_articulos.php?coddiv=" . urlencode($code));

            // Verifica si la respuesta es exitosa
            if ($response->successful()) {
                $data = $response->json();

                // Validar que la API devolvió datos en formato esperado
                if (!is_array($data) || empty($data)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se encontraron artículos para este código.',
                        'data' => []
                    ], 404);
                }

                // Devolver los artículos en formato JSON
                return response()->json([
                    'success' => true,
                    'data' => $data
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al obtener artículos. Código HTTP: ' . $response->status()
                ], $response->status());
            }
        } catch (\Exception $e) {
            // Manejo de errores si la API no responde o hay otro problema
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado al obtener los artículos.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAllBoms()
    {
        $boms = Bom::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('boms as a2')
                    ->whereColumn('a2.reference_id', 'boms.reference_id');
            })
            ->get();

        return response()->json($boms, 200);
    }

    public function newArticle(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'base_quantity' => 'nullable|numeric',
                'details' => 'nullable|string',
                'status' => 'required|boolean',
                'ingredients' => 'required|json',
                'code_details' => '',
                'code_ingredients' => 'required|json',
                'user' => 'string|nullable',
            ]);
            $validatedData['version'] = '1';
            $validatedData['reference_id'] = (string) Str::uuid();
            $bom = Bom::create($validatedData);

            return response()->json([
                'message' => 'BOM guardado exitosamente',
                'bom' => $bom
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al guardar el BOM',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getArticleById($id)
    {
        try {
            $bom = Bom::findOrFail($id);

            return response()->json([
                'bom' => $bom
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'BOM no encontrado'
            ], 404);
        }
    }

    public function updateArticle(Request $request, $id)
    {
        try {
            $bom = Bom::findOrFail($id);

            $validatedData = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'base_quantity' => 'nullable|numeric',
                'details' => 'nullable|string',
                'status' => 'required|boolean',
                'ingredients' => 'required|json',
                'code_details' => '',
                'code_ingredients' => 'required|json'
            ]);
            $bom->active = false;
            $bom->save();
            // Crear nueva versión
            $newVersion = (int) $bom->version + 1;

            $newBom = $bom->replicate(); // duplica todos los atributos excepto la PK
            $newBom->version = $newVersion;
            $newBom->fill($validatedData);
            $newBom->reference_id = $bom->reference_id ?? (string) Str::uuid();
            $newBom->active = true; // activamos la nueva versión
            $newBom->save();

            return response()->json([
                'message' => 'BOM actualizado exitosamente',
                'bom' => $bom
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar el BOM',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteArticle($id)
    {
        try {
            $bom = Bom::findOrFail($id);

            $bom->active = false;
            $bom->save();

            return response()->json([
                'message' => 'BOM eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'BOM no encontrado'
            ], 404);
        }
    }

    public function getArticleByClientId($clientId)
    {
        try {
            $boms = Bom::where('client_id', $clientId)->get();

            return response()->json([
                'boms' => $boms
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener los BOMs',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}