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
            'control_id'   => 'nullable|exists:stages,id',
            'orden_id'     => 'required|string',
            'time'         => 'required|integer|min:0',
        ]);

        //// Log::info('🔔 [Timer Store] Petición recibida', $validated);

        // ✅ Validar si ya existe un timer para esta actividad, sin importar su estado
        $existingTimer = Timer::where('ejecutada_id', $validated['ejecutada_id'])->first();

        if ($existingTimer) {
            return response()->json([
                'exists' => true,
                'message' => 'Ya existe un timer para esta actividad.',
                'timer' => $existingTimer,
            ], 200); // OK
        }

        // ✅ Si no existe, crear nuevo timer
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
        ], 201); // Created
    }

    // Pausar un timer
    public function pause(Request $request)
    {
        $request->validate([
            'ejecutada_id' => 'required|integer',
        ]);

        $timer = Timer::where('ejecutada_id', $request->ejecutada_id)
            ->where('finish', 0)->first();

        if (!$timer) return response()->json(['message' => 'Timer no encontrado'], 404);

        if ($timer->pause == 0) {
            // Pausamos
            $timer->status = 'paused';
            $timer->pause = 1;
            $timer->paused_at = now();

            // Guarda también snapshot de restante en minutos (útil para UI heredada)
            $timer->pause_time = (int) ceil($this->computeRemainingSeconds($timer) / 60);
            $message = 'Timer pausado correctamente';
        } else {
            // Reanudamos
            if ($timer->paused_at) {
                $timer->accumulated_pause_secs += $timer->paused_at->diffInSeconds(now());
            }
            $timer->status = 'running';
            $timer->pause = 0;
            $timer->paused_at = null;
            $message = 'Timer reanudado correctamente';
        }

        $timer->save();
        return response()->json(['message' => $message, 'timer' => $this->withComputed($timer)]);
    }

    // Finalizar un timer
    public function finish(Request $request)
    {
        $request->validate(['ejecutada_id' => 'required|integer']);

        $timer = Timer::where('ejecutada_id', $request->ejecutada_id)
            ->where('finish', 0)->first();

        if (!$timer) {
            Log::warning('No se encontró timer activo para ejecutada_id=' . $request->ejecutada_id);
            return response()->json(['message' => 'Timer no encontrado para esta ejecución'], 404);
        }

        // Si estaba en pausa, suma esa pausa también
        if ($timer->pause == 1 && $timer->paused_at) {
            $timer->accumulated_pause_secs += $timer->paused_at->diffInSeconds(now());
            $timer->paused_at = null;
        }

        $timer->status = 'finished';
        $timer->finish = 1;
        $timer->finished_at = now();
        $timer->save();

        return response()->json(['message' => 'Timer finalizado correctamente', 'timer' => $this->withComputed($timer)]);
    }

    // Reiniciar un timer
    public function reset(Request $request)
    {
        $request->validate([
            'ejecutada_id' => 'required|integer',
            'time_reset'   => 'required|integer|min:0', // minutos
        ]);

        $timer = Timer::where('ejecutada_id', $request->ejecutada_id)->first();

        if (!$timer) return response()->json(['message' => 'Timer no encontrado para esta ejecución'], 404);

        $timer->status      = 'running';
        $timer->pause       = 0;
        $timer->pause_time  = 0;
        $timer->finish      = 0;
        $timer->time        = (int)$request->time_reset; // minutos
        $timer->started_at  = now();
        $timer->paused_at   = null;
        $timer->finished_at = null;
        $timer->accumulated_pause_secs = 0;
        $timer->save();

        return response()->json(['message' => 'Timer reiniciado correctamente', 'timer' => $this->withComputed($timer)]);
    }


    public function show($id)
    {
        $timer = Timer::findOrFail($id);
        return response()->json($this->withComputed($timer));
    }

    public function index()
    {
        $timers = Timer::all()->map(fn($t) => $this->withComputed($t));
        return response()->json($timers);
    }

    public function getEjecutadaId($ejecutada_id)
    {
        $timer = Timer::where('ejecutada_id', $ejecutada_id)->first();

        if ($timer) {
            return response()->json(['exists' => true, 'timer' => $this->withComputed($timer)]);
        }
        return response()->json(['exists' => false, 'timer' => null]);
    }

    // App/Http/Controllers/TimerController.php (añade métodos privados)
    private function computeRemainingSeconds(Timer $t): int
    {
        $duration = max(0, (int)$t->time * 60); // 'time' son minutos
        if (!$t->started_at) return $duration;
        if ((bool)$t->finish || $t->status === 'finished') return 0;

        $now = now();
        $elapsed = $t->started_at->diffInSeconds($now);
        $pausedNow = ($t->pause == 1 && $t->paused_at) ? $t->paused_at->diffInSeconds($now) : 0;

        $effective = max(0, $elapsed - (int)$t->accumulated_pause_secs - $pausedNow);
        return max(0, $duration - $effective);
    }

    private function withComputed(Timer $t): array
    {
        return [
            'id' => $t->id,
            'ejecutada_id' => $t->ejecutada_id,
            'stage_id' => $t->stage_id,
            'control_id' => $t->control_id,
            'orden_id' => $t->orden_id,
            'time' => $t->time,
            'status' => $t->status,
            'pause' => (bool)$t->pause,
            'pause_time' => (int)$t->pause_time,
            'finish' => (bool)$t->finish,
            'started_at' => optional($t->started_at)->toIso8601String(),
            'paused_at' => optional($t->paused_at)->toIso8601String(),
            'finished_at' => optional($t->finished_at)->toIso8601String(),
            'accumulated_pause_secs' => (int)$t->accumulated_pause_secs,
            'remaining_seconds' => $this->computeRemainingSeconds($t),
            'server_epoch_ms' => (int) floor(microtime(true) * 1000),
        ];
    }
}
