<?php

namespace App\Http\Controllers;

use App\Models\ActividadesEjecutadas;
use App\Models\AdaptationDate;
use App\Models\Clients;
use App\Models\Machinery;
use App\Models\Manufacturing;
use App\Models\OrdenesEjecutadas;
use App\Models\Stage;
use App\Models\User;
use GuzzleHttp\Client;
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
        // Limpiamos espacios en blanco en cada elemento
        if (isset($validated['machine']) && is_array($validated['machine'])) {
            $validated['machine'] = array_map(fn($item) => intval($item), $validated['machine']);
        }

        if (isset($validated['line']) && is_array($validated['line'])) {
            $validated['line'] = array_map(fn($item) => intval($item), $validated['line']);
        }

        if (isset($validated['users']) && is_array($validated['users'])) {
            $validated['users'] = array_map(fn($item) => intval($item), $validated['users']);
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

    public function getPlanByIdPDF($id)
    {
        try {
            Log::info("🔍 Iniciando getPlanByIdPDF con ID: $id");

            // Obtener el plan con la relación hacia maestra
            $plan = AdaptationDate::with('adaptation.maestra')->find($id);
            if (!$plan) {
                Log::warning("❌ Plan no encontrado para ID: $id");
                return response()->json(['error' => 'Plan not found'], 404);
            }

            Log::info("✅ Plan base obtenido", ['plan' => $plan->toArray()]);
            $cliente = $plan->adaptation?->client_id;
            $ordenadas = $plan->adaptation?->id;
            // Obtener stages desde la maestra
            $maestra = $plan->adaptation?->maestra;
            Log::info("📦 Maestra encontrada", ['maestra' => optional($maestra)->toArray()]);

            $stageIds = [];
            if ($maestra && isset($maestra->type_stage)) {
                $stageRaw = $maestra->type_stage;

                if (is_string($stageRaw)) {
                    $decoded = json_decode($stageRaw, true);
                    $stageIds = is_array($decoded) ? $decoded : [];
                } elseif (is_array($stageRaw)) {
                    $stageIds = $stageRaw;
                }
            }

            Log::info("📌 stageIds decodificados:", $stageIds);

            $stages = Stage::whereIn('id', $stageIds)->get();
            // Reordenar según el orden original de $stageIds
            $stages = $stages->sortBy(function ($stage) use ($stageIds) {
                return array_search($stage->id, $stageIds);
            })->values();
            Log::info("📄 Stages cargados:", $stages->toArray());

            // Decodificación con protección
            $masterIds = json_decode($plan->master ?? '[]', true);
            $masterIds = is_array($masterIds) ? $masterIds : [];
            Log::info("🔧 masterIds:", $masterIds);

            $lineIds = json_decode($plan->line ?? '[]', true);
            $lineIds = is_array($lineIds) ? $lineIds : [];
            Log::info("🔧 lineIds:", $lineIds);

            $machineIds = json_decode($plan->machine ?? '[]', true);
            $machineIds = is_array($machineIds) ? $machineIds : [];
            Log::info("🔧 machineIds:", $machineIds);

            $userIds = json_decode($plan->users ?? '[]', true);
            $userIds = is_array($userIds) ? $userIds : [];
            Log::info("🔧 userIds:", $userIds);

            // Consultas

            $clientes = Clients::where('id', $cliente)->first();
            Log::info("🏭 Clientes:", $clientes->toArray());

            $ordenasEje = OrdenesEjecutadas::where('adaptation_date_id', $ordenadas)->first();
            Log::info("🏭 Ordenadas:", $ordenasEje->toArray());

            $actividadesEje = ActividadesEjecutadas::where('adaptation_date_id', $ordenadas)->get();
            Log::info("📄 Actividades ejecutadas:", $actividadesEje->toArray());

            $masterStages = Stage::whereIn('id', $masterIds)->get();
            Log::info("🛠 masterStages:", $masterStages->toArray());

            $lines = Manufacturing::whereIn('id', $lineIds)->get();
            Log::info("🏭 Líneas:", $lines->toArray());

            $machines = Machinery::whereIn('id', $machineIds)->get();
            Log::info("⚙️ Máquinas:", $machines->toArray());

            $users = User::whereIn('id', $userIds)->get();
            Log::info("👥 Usuarios:", $users->toArray());

            return response()->json([
                'plan' => $plan,
                'cliente' => $clientes,
                'ordenadas' => $ordenasEje,
                'actividadesEjecutadas' => $actividadesEje,
                'stages' => $stages,
                'masterStages' => $masterStages,
                'lines' => $lines,
                'machines' => $machines,
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            Log::error("💥 Error en getPlanByIdPDF: " . $e->getMessage());
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}