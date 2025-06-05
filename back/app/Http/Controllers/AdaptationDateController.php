<?php

namespace App\Http\Controllers;

use App\Models\AdaptationDate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdaptationDateController extends Controller
{
    public function index()
    {
        return AdaptationDate::with(['client', 'adaptation'])->get();
    }

    public function show($id)
    {
        $record = AdaptationDate::with(['client', 'adaptation'])->findOrFail($id);
        return response()->json($record);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'codart' => 'required|string',
            'orderNumber' => 'required|string',
            'number_order' => 'required|string',
            'deliveryDate' => 'required|date',
            'quantityToProduce' => 'required|integer',
            'lot' => 'required|string',
            'healthRegistration' => 'required|string',
            'master' => 'nullable|json',
            'bom' => 'nullable|json',
            'ingredients' => 'nullable|json',
            'adaptation_id' => 'nullable|exists:adaptations,id',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
            'duration' => 'nullable|string',
            'duration_breakdown' => 'nullable|json',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $record = AdaptationDate::create($validated);
        return response()->json($record, 201);
    }

    public function update(Request $request, $id)
    {
        Log::info('Update Request payload: ' . json_encode($request->all()));

        // Si mandan 'line' como string JSON, decodificamos
        if ($request->has('line') && is_string($request->line)) {
            $request->merge([
                'line' => json_decode($request->line, true)
            ]);
            Log::info('Decoded line to array:', ['line' => $request->line]);
        }

        // Validamos normalmente, ahora 'line' es array de IDs y 'activities' es array plano
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'codart' => 'sometimes|string',
            'orderNumber' => 'sometimes|string',
            'number_order' => 'sometimes|string',
            'deliveryDate' => 'sometimes|date',
            'quantityToProduce' => 'sometimes|integer',
            'lot' => 'sometimes|string',
            'healthRegistration' => 'sometimes|string',
            'master' => 'nullable|json',
            'bom' => 'nullable|json',
            'ingredients' => 'nullable|json',
            'adaptation_id' => 'nullable|exists:adaptations,id',
            'status_dates' => 'nullable|string',
            'factory' => 'nullable|string',
            'line' => 'nullable|array',
            'activities' => 'nullable|array',
            'resource' => 'nullable|string',
            'machine' => 'nullable|array',
            'users' => 'nullable|array',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
            'duration' => 'nullable|string',
            'duration_breakdown' => 'nullable|json',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);
        // Limpiamos espacios en blanco en cada elemento de 'line', si existe
        if (isset($validated['line']) && is_array($validated['line'])) {
            $validated['line'] = array_map(fn($item) => trim($item), $validated['line']);
        }
        if (isset($validated['machine']) && is_array($validated['machine'])) {
            $validated['machine'] = array_map(fn($item) => trim($item), $validated['machine']);
        }

        if (isset($validated['users']) && is_array($validated['users'])) {
            $validated['users'] = array_map(fn($item) => trim($item), $validated['users']);
        }

        $record = AdaptationDate::findOrFail($id);

        // Actualizamos el registro con ambos campos bien separados
        $record->update($validated);

        Log::info('Update successful:', $record->toArray());
        return response()->json($record);
    }

    public function destroy($id)
    {
        $record = AdaptationDate::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'AdaptationDate deleted']);
    }

    public function getPlan()
    {
        try {
            $plan = AdaptationDate::all();
            return response()->json([
                'plan' => $plan
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error retrieving plan',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getPlanById($id)
    {
        try {
            $plan = AdaptationDate::getPlanByIdEloquent($id);

            if (!$plan) {
                return response()->json(['error' => 'Adaptation not found'], 404);
            }

            return response()->json(['plan' => $plan], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPlanUnic($id)
    {
        try {
            $plan = AdaptationDate::find($id);

            if (!$plan) {
                return response()->json(['error' => 'Adaptation not found'], 404);
            }

            return response()->json(['plan' => $plan], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}