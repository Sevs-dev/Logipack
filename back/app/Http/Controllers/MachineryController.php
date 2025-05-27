<?php

namespace App\Http\Controllers;

use App\Models\Machinery;
use Illuminate\Http\Request;

class MachineryController extends Controller
{
    public function getMachin()
    {
        $machineries = Machinery::with('factory')->get();
        return response()->json($machineries);
    }

    public function newMachin(Request $request)
    {
        $validated = $request->validate([
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
        ]);

        $machinery = Machinery::create($validated);

        return response()->json($machinery, 201);
    }

    public function MachinId($id)
    {
        $machinery = Machinery::with('factory')->findOrFail($id);
        return response()->json($machinery);
    }

    public function updateMachin(Request $request, $id)
    {
        $machinery = Machinery::findOrFail($id);

        $validated = $request->validate([
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
        ]);

        $machinery->update($validated);

        return response()->json($machinery);
    }

    public function deleteMachin($id)
    {
        $machinery = Machinery::findOrFail($id);
        $machinery->delete();

        return response()->json(['message' => 'Machinery deleted successfully.']);
    }
}