<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Factory;
use Illuminate\Http\JsonResponse;
use App\Models\Consecutive;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class FactoryController extends Controller
{
    // Obtener todas las fábricas
    public function getFactories(): JsonResponse
    { 
        $factories = Factory::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('factories as a2')
                    ->whereColumn('a2.reference_id', 'factories.reference_id');
            })
            ->get();

        return response()->json($factories, 200);
    }

    // Crear una nueva fábrica
    public function newFactory(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'capacity' => 'required|string|min:1',
            'manager' => 'required|string|max:255',
            'employees' => 'required',
            'status' => 'required|boolean',
            'prefix' => 'required|string',
            'user' => 'string|nullable',
        ]);
        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();
        $factory = Factory::create($validatedData);

        // Obtener fecha actual
        $now = Carbon::now();
        $month = $now->format('m');
        $year = $now->format('Y');
        $prefix = $request->prefix;

        // Buscar el último consecutive con este prefijo, mes y año
        $last = Consecutive::where('prefix', $prefix)
            ->where('month', $month)
            ->where('year', $year)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $last
            ? (int) $last->consecutive + 1
            : 1;

        $consecutiveFormatted = str_pad($nextNumber, 7, '0', STR_PAD_LEFT);

        // Crear el nuevo consecutive
        Consecutive::create([
            'prefix' => $prefix,
            'month' => $month,
            'year' => $year,
            'consecutive' => $consecutiveFormatted,
        ]);

        return response()->json([
            'message' => 'Fábrica creada exitosamente con consecutive',
            'factory' => $factory,
            'consecutive' => $prefix . '-' . $month . '-' . $year . '-' . $consecutiveFormatted
        ], 201);
    }

    // Obtener una fábrica por ID
    public function factoryId($id): JsonResponse
    {
        $factory = Factory::find($id);
        if (!$factory) {
            return response()->json(['message' => 'Fábrica no encontrada'], 404);
        }
        return response()->json($factory);
    }

    // Actualizar una fábrica
    public function updateFactory(Request $request, $id): JsonResponse
    {
        $factory = Factory::find($id);
        if (!$factory) {
            return response()->json(['message' => 'Fábrica no encontrada'], 404);
        }

        $validatedData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|string|min:1',
            'manager' => 'sometimes|string|max:255',
            'employees' => 'sometimes|string|min:0',
            'status' => 'sometimes|boolean',
            'prefix' => 'sometimes|string',
            'user' => 'string|nullable'
        ]);

        // Verifica si se envió un nuevo prefijo
        if ($request->has('prefix') && $request->prefix !== $factory->prefix) {
            $oldPrefix = $factory->prefix;
            $newPrefix = $request->prefix;

            // Actualiza todos los consecutives que tengan el prefijo anterior
            \App\Models\Consecutive::where('prefix', $oldPrefix)->update([
                'prefix' => $newPrefix
            ]);
        }

        // Crear nueva versión
        $newVersion = (int) $factory->version + 1;

        $new = $factory->replicate(); // duplica todos los atributos excepto la PK
        $new->version = $newVersion;
        $new->fill($validatedData);
        $new->reference_id = $factory->reference_id ?? (string) Str::uuid();
        $new->active = true; // activamos la nueva versión
        $new->save();


        return response()->json([
            'message' => 'Fábrica actualizada correctamente',
            'factory' => $factory
        ]);
    }

    // Eliminar una fábrica
    public function deleteFactory($id): JsonResponse
    {
        $factory = Factory::find($id);
        if (!$factory) {
            return response()->json(['message' => 'Fábrica no encontrada'], 404);
        }
        $factory->active = false;
        $factory->save();
        $factory->delete();

        return response()->json(['message' => 'Fábrica eliminada correctamente']);
    }
}