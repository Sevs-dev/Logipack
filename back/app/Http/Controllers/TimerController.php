<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Timer;

class TimerController extends Controller
{
    // Crear un nuevo timer
    public function store(Request $request)
    {
        $validated = $request->validate([
            'adaptation_id' => 'required|exists:adaptation_dates,id',
            'stage_id'      => 'required|exists:stages,id',
            'time'  => 'required|integer|min:0',
        ]);

        $timer = Timer::create([
            'adaptation_id' => $validated['adaptation_id'],
            'stage_id'      => $validated['stage_id'],
            'time'  => $validated['time'],
            'status' => '0',
            'pause' => 0, // Inicialmente no hay pausa
            'finish' => 0, // Inicialmente no hay finalización
        ]);

        return response()->json([
            'message' => 'Timer creado con éxito',
            'timer'   => $timer,
        ], 201);
    }

    // Pausar un timer
    public function pause($id)
    {
        $timer = Timer::findOrFail($id);
        $timer->status = 'paused';
        $timer->save();

        return response()->json([
            'message' => 'Timer pausado',
            'timer'   => $timer,
        ]);
    }

    // Finalizar un timer
    public function finish($id)
    {
        $timer = Timer::findOrFail($id);
        $timer->status = 'finished';
        $timer->save();

        return response()->json([
            'message' => 'Timer finalizado',
            'timer'   => $timer,
        ]);
    }

    // Reiniciar un timer (opcional: puedes resetear el tiempo a 0 si quieres)
    public function reset($id)
    {
        $timer = Timer::findOrFail($id);
        $timer->status = 'running';
        $timer->time = 0; // Opcional: reinicia el tiempo
        $timer->save();

        return response()->json([
            'message' => 'Timer reiniciado',
            'timer'   => $timer,
        ]);
    }

    // Obtener un timer por ID
    public function show($id)
    {
        $timer = Timer::findOrFail($id);

        return response()->json($timer);
    }

    // Listar timers (puedes filtrar por adaptation_id y/o stage_id)
    public function index(Request $request)
    {
        $query = Timer::query();

        if ($request->has('adaptation_id')) {
            $query->where('adaptation_id', $request->adaptation_id);
        }

        if ($request->has('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        $timers = $query->orderBy('created_at', 'desc')->get();

        return response()->json($timers);
    }
}