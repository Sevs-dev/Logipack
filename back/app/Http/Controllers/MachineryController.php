<?php

namespace App\Http\Controllers;

use App\Models\Machinery;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MachineryController extends Controller
{
    public function getMachin()
    {
        $machineries = Machinery::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('machineries as a2')
                    ->whereColumn('a2.reference_id', 'machineries.reference_id');
            })
            ->get();

        return response()->json($machineries, 200);
    }

    public function newMachin(Request $request)
    {
        $validatedData = $request->validate([
            'factory_id' => 'required|exists:factories,id',
            'name' => 'required|string ',
            'category' => 'required',
            'type' => 'nullable|string ',
            'power' => 'nullable|string',
            'capacity' => 'nullable|string',
            'dimensions' => 'nullable|string',
            'weight' => 'nullable|string',
            'is_mobile' => 'boolean',
            'description' => 'nullable|string',
            'user' => 'string|nullable',
        ]);

        $validatedData['version'] = '1';
        $validatedData['reference_id'] = (string) Str::uuid();
        $machinery = Machinery::create($validatedData);

        return response()->json([
            'message' => 'Maquinaria creada exitosamente',
            'machinery' => $machinery
        ], 201);
    }

    public function MachinId($id)
    {
        $machinery = Machinery::with('factory')->findOrFail($id);
        return response()->json($machinery);
    }

    public function updateMachin(Request $request, $id)
    {
        $machinery = Machinery::findOrFail($id);

        $validatedData = $request->validate([
            'factory_id' => 'required|exists:factories,id',
            'name' => 'required|string ',
            'category' => 'required|string',
            'type' => 'nullable|string ',
            'power' => 'nullable|string',
            'capacity' => 'nullable|string',
            'dimensions' => 'nullable|string',
            'weight' => 'nullable|string',
            'is_mobile' => 'boolean',
            'description' => 'nullable|string',
            'user' => 'string|nullable',
        ]);
        // Crear nueva versión
        $newVersion = (int) $machinery->version + 1;

        $new = $machinery->replicate(); // duplica todos los atributos excepto la PK
        $new->version = $newVersion;
        $new->fill($validatedData);
        $new->reference_id = $machinery->reference_id ?? (string) Str::uuid();
        $new->active = true; // activamos la nueva versión
        $new->save();

        return response()->json([
            'message' => 'Maquinaria actualizada correctamente',
            'machinery' => $machinery
        ]);
    }

    public function deleteMachin($id)
    {
        $machinery = Machinery::findOrFail($id);
        $machinery->active = false;
        $machinery->save();
        return response()->json(['message' => 'Machinery deleted successfully.']);
    }
}