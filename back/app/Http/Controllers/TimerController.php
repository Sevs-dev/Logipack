<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Timer;
use Illuminate\Support\Facades\Log;

class TimerController extends Controller
{
    // Crear un nuevo timer
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ejecutada_id' => 'required|exists:actividades_ejecutadas,id',
            'stage_id'     => 'required|exists:stages,id',
            'control_id'     => 'nullable|exists:stages,id',
            'orden_id'     => 'required|string',
            'time'         => 'required|integer|min:0',
        ]);

        // Si ya existe un Timer para esta ejecutada_id, retornar error
        $exists = Timer::where('ejecutada_id', $validated['ejecutada_id'])->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Timer ya existe para esta ejecutada_id',
            ], 409); // Conflict
        }

        // Crear Timer
        $timer = Timer::create([
            'ejecutada_id' => $validated['ejecutada_id'],
            'stage_id'     => $validated['stage_id'],
            'control_id'   => $validated['control_id'],
            'orden_id'     => $validated['orden_id'],
            'time'         => $validated['time'],
            'status'       => '0',
            'pause'        => 0,
            'pause_time'   => 0,
            'finish'       => 0,
        ]);

        return response()->json([
            'message' => 'Timer creado con éxito',
            'timer'   => $timer,
        ], 201);
    }

    // Pausar un timer
    public function pause(Request $request)
    {
        $request->validate([
            'ejecutada_id' => 'required|integer',
            'pause_time'   => 'required|integer',
        ]);

        $timer = Timer::where('ejecutada_id', $request->ejecutada_id)
            ->where('finish', 0)
            ->first();

        if (!$timer) {
            return response()->json([
                'message' => 'Timer no encontrado',
            ], 404);
        }

        if ($timer->pause == 0) {
            // Si está corriendo → lo pausamos
            $timer->status = 'paused';
            $timer->pause = 1;
            $timer->pause_time = $request->pause_time;
            $message = 'Timer pausado correctamente';
        } else {
            // Si está pausado → lo reanudamos
            $timer->status = 'running';
            $timer->pause = 0;
            $message = 'Timer reanudado correctamente';
        }

        $timer->save();

        return response()->json([
            'message' => $message,
            'timer'   => $timer,
        ]);
    }

    // Finalizar un timer
    public function finish(Request $request)
    {
        $request->validate([
            'ejecutada_id' => 'required|integer',
        ]);

        $timer = Timer::where('ejecutada_id', $request->ejecutada_id)
            ->where('finish', 0)
            ->first();

        if (!$timer) {
            return response()->json([
                'message' => 'Timer no encontrado para esta ejecución',
            ], 404);
        }

        $timer->status = 'finished';
        $timer->finish = 1;
        $timer->save();

        return response()->json([
            'message' => 'Timer finalizado correctamente',
            'timer'   => $timer,
        ]);
    }

    // Reiniciar un timer
    public function reset(Request $request)
    {
        $request->validate([
            'ejecutada_id' => 'required|integer',
            'time_reset'   => 'required|integer',
        ]);

        $timer = Timer::where('ejecutada_id', $request->ejecutada_id)
            ->first();

        if (!$timer) {
            return response()->json([
                'message' => 'Timer no encontrado para esta ejecución',
            ], 404);
        }

        $timer->status      = 'running';
        $timer->pause       = 0;
        $timer->pause_time  = 0;
        $timer->finish      = 0;
        $timer->time        = $request->time_reset;
        $timer->save();

        return response()->json([
            'message' => 'Timer reiniciado correctamente',
            'timer'   => $timer,
        ]);
    }

    // Obtener un timer por ID
    public function show($id)
    {
        $timer = Timer::findOrFail($id);

        return response()->json($timer);
    }

    // Listar timers (puedes filtrar si quieres)
    public function index()
    {
        $query = Timer::all();

        return response()->json($query);
    }

    // Obtener un timer por ejecutada_id
    public function getEjecutadaId($ejecutada_id)
    {
        $timer = Timer::where('ejecutada_id', $ejecutada_id)->first();

        if ($timer) {
            return response()->json([
                'exists' => true,
                'timer'  => $timer
            ]);
        } else {
            return response()->json([
                'exists' => false,
                'timer'  => null
            ]);
        }
    }
}