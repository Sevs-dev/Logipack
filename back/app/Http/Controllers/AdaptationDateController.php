<?php

namespace App\Http\Controllers;

use App\Models\AdaptationDate;
use Illuminate\Http\Request;

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
        $record = AdaptationDate::findOrFail($id);

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
            'status_dates' =>'nullable|string',
            'factory' => 'nullable|string',
            'line' => 'nullable|string',
            'resource' => 'nullable|string',
            'machine' => 'nullable|string',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
            'duration' => 'nullable|string',
            'duration_breakdown' => 'nullable|json',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $record->update($validated);
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
            $plan = AdaptationDate::findOrFail($id);
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
}