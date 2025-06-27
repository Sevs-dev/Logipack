<?php

namespace App\Http\Controllers;

use App\Models\TimerControl;
use Illuminate\Http\Request;

class TimerControlController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'timer_id' => 'required|exists:timers,id', 
            'user' => 'string|nullable',
            'data' => 'required|array',
            'data.*.activity_id' => 'required|integer',
            'data.*.tipo' => 'required|string',
            'data.*.descripcion' => 'required|string',
            'data.*.valor' => 'nullable',
            'data.*.clave' => 'nullable|string',
        ]);

        $registro = TimerControl::create($validated);

        return response()->json(['message' => 'Datos guardados', 'registro' => $registro], 201);
    }
}