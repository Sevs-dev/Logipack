<?php

namespace App\Http\Controllers;

use App\Models\ActividadesControls;
use App\Models\ActividadesEjecutadas;
use App\Models\ActividadesTestigos;
use App\Models\AdaptationDate;
use App\Models\Clients;
use App\Models\Conciliaciones;
use App\Models\Factory;
use App\Models\Machinery;
use App\Models\Manufacturing;
use App\Models\OrdenesEjecutadas;
use App\Models\Stage;
use App\Models\Timer;
use App\Models\User;
use App\Services\ArticleService;
use App\Services\PdfAttachmentService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdaptationDateController extends Controller
{
    protected PdfAttachmentService $pdfService;

    public function __construct(PdfAttachmentService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

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
        // Helper para decodificar JSON si llega como string
        $decodeIfJsonString = static function ($value) {
            if (is_string($value)) {
                $trim = trim($value);
                if ($trim === '') {
                    return null;
                }
                $decoded = json_decode($trim, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $decoded;
                }
            }
            return $value;
        };

        // Campos que podrían venir como JSON string
        foreach (['line', 'machine', 'users', 'activities'] as $k) {
            if ($request->has($k)) {
                $request->merge([
                    $k => $decodeIfJsonString($request->input($k)),
                ]);
            }
        }

        // Compat: si 'line' llega como string JSON
        if ($request->has('line') && is_string($request->line)) {
            $request->merge([
                'line' => json_decode($request->line, true)
            ]);
        }

        // Validación (agregamos planning_time y order_time)
        $validated = $request->validate([
            'client_id'           => 'sometimes|exists:clients,id',
            'codart'              => 'sometimes|string',
            'orderNumber'         => 'sometimes|string',
            'number_order'        => 'sometimes|string',
            'deliveryDate'        => 'sometimes|date',
            'quantityToProduce'   => 'sometimes|integer',
            'lot'                 => 'sometimes|string',
            'healthRegistration'  => 'sometimes|string',
            'master'              => 'nullable|json',
            'bom'                 => 'nullable|json',
            'ingredients'         => 'nullable|json',
            'adaptation_id'       => 'nullable|exists:adaptations,id',
            'status_dates'        => 'nullable|string',
            'factory'             => 'nullable|string',
            'line'                => 'nullable|array',
            'activities'          => 'nullable|array',
            'resource'            => 'nullable|string',
            'machine'             => 'nullable|array',
            'users'               => 'nullable|array',
            'color'               => 'nullable|string',
            'icon'                => 'nullable|string',
            'duration'            => 'nullable|string',
            'duration_breakdown'  => 'nullable|json',
            'planning_user'       => 'nullable|string',
            'user'                => 'nullable|string',
            'planning_time'       => 'nullable|date',
            'order_time'          => 'nullable|date',
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date',
        ]);

        // Normalizar arrays a enteros
        foreach (['machine', 'line', 'users'] as $k) {
            if (isset($validated[$k]) && is_array($validated[$k])) {
                $validated[$k] = array_map(static fn($item) => (int) $item, $validated[$k]);
            }
        }
        $record = AdaptationDate::findOrFail($id);
        $authUser   = $request->user();

        // ====== LÓGICA planning_user + planning_time ======
        $isPlanning = $request->input('status_dates') === 'Planificación';
        if ($isPlanning) {
            $incomingPlanningUser = $authUser?->name ?? $request->input('planning_user');
            if ($incomingPlanningUser) {
                $validated['planning_user'] = $incomingPlanningUser;
                if (empty($record->planning_user) || $record->planning_user !== $incomingPlanningUser) {
                    $validated['planning_time'] = now();
                }
            }
        }
        $incomingUser = $authUser?->name ?? $request->input('user');
        if ($incomingUser) {
            $validated['user'] = $incomingUser;
            if (empty($record->user) || $record->user !== $incomingUser) {
                $validated['order_time'] = now();
            }
        }
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
            // Log::info('PLAN:', [$plan]);

            return response()->json([
                'plan' => $plan
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving plan:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getPlanDash()
    {
        try {
            // Incluye solo id y name del cliente
            $plan = AdaptationDate::with(['client:id,name'])->get();

            // Log::info('PLAN:', [$plan]);

            return response()->json([
                'plan' => $plan
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving plan:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getPlanById($id)
    {
        try {
            $plan = AdaptationDate::getPlanByIdEloquent($id);

            // Log para inspeccionar el contenido de $plan
            Log::info('Contenido de $plan en getPlanById:', ['plan' => $plan]);

            if (!$plan) {
                return response()->json(['error' => 'Adaptation not found'], 404);
            }

            return response()->json(['plan' => $plan], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving plan: ' . $e->getMessage());
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

            // Log para ver qué trae $plan
            Log::info('Contenido de $plan en getPlanUnic:', ['plan' => $plan]);

            if (!$plan) {
                return response()->json(['error' => 'Adaptation not found'], 404);
            }

            return response()->json(['plan' => $plan], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving plan in getPlanUnic: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPlanByIdPDF($id)
    {
        try {
            // Log::info("🔍 Iniciando getPlanByIdPDF con ID: $id");

            $plan = AdaptationDate::with('adaptation.maestra')->find($id);
            if (!$plan) {
                // Log::warning("❌ Plan no encontrado para ID: $id");
                return response()->json(['error' => 'Plan not found'], 404);
            }

            // Log::info("✅ Plan base obtenido", ['plan' => $plan->toArray()]);
            $cliente = $plan->adaptation?->client_id;
            $codart = $plan->codart;

            $maestra = $plan->adaptation?->maestra;
            // Log::info("📦 Maestra encontrada", ['maestra' => optional($maestra)->toArray()]);

            $clientes = Clients::where('id', $cliente)->first();
            // Log::info("🏭 Cliente", ['cliente' => optional($clientes)->toArray()]);

            $coddiv = $clientes->code ?? null;
            $desart = null;

            if (!$coddiv) {
                // Log::warning("⚠️ Cliente sin código definido, no se puede consultar artículo.");
            } else {
                $desart = ArticleService::getDesartByCodart($coddiv, $codart);
                // Log::info("📄 Artículo encontrado remotamente", [
                //     'coddiv' => $coddiv,
                //     'codart' => $codart,
                //     'desart' => $desart
                // ]);
            }

            // 🔧 Procesar relaciones y referencias
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

            // Log::info("📌 stageIds decodificados", ['stageIds' => $stageIds]);

            $stages = Stage::whereIn('id', $stageIds)->get();
            $stages = $stages->sortBy(function ($stage) use ($stageIds) {
                return array_search($stage->id, $stageIds);
            })->values();
            // Log::info("📄 Stages cargados", ['stages' => $stages->toArray()]);

            $masterIds = json_decode($plan->master ?? '[]', true);
            $masterIds = is_array($masterIds) ? $masterIds : [$plan->master];
            // Log::info("🔧 masterIds", ['masterIds' => $masterIds]);

            $lineIds = json_decode($plan->line ?? '[]', true);
            $lineIds = is_array($lineIds) ? $lineIds : [$plan->line];
            // Log::info("🔧 lineIds", ['lineIds' => $lineIds]);

            $machineIds = json_decode($plan->machine ?? '[]', true);
            $machineIds = is_array($machineIds) ? $machineIds : [$plan->machine];
            // Log::info("🔧 machineIds", ['machineIds' => $machineIds]);

            $userIds = json_decode($plan->users ?? '[]', true);
            $userIds = is_array($userIds) ? $userIds : [$plan->users];
            // Log::info("🔧 userIds", ['userIds' => $userIds]);

            // 🏭 Cargar líneas antes del mapeo de forms
            $lines = Manufacturing::whereIn('id', $lineIds)->get();
            // Log::info("🏭 Líneas", ['lines' => $lines->toArray()]);
            $lineMap = $lines->pluck('name', 'id');

            $ordenasEje = OrdenesEjecutadas::where('adaptation_date_id', $plan->id)->first();
            // Log::info("📦 Orden ejecutada", ['ordenada' => optional($ordenasEje)->toArray()]);

            $actividadesEje = ActividadesEjecutadas::where('adaptation_date_id', $plan->id)->get();
            // Log::info("📄 Actividades ejecutadas (crudas)", ['actividadesEjecutadas' => $actividadesEje->toArray()]);

            // ✅ Decodificar `forms` y reemplazar `linea` por nombre
            $actividadesEje = $actividadesEje->map(function ($actividad) use ($lineMap) {
                $actividadArr = $actividad->toArray();  // ✅ ya no es modelo, sino array simple

                try {
                    $forms = json_decode($actividadArr['forms'], true);

                    if (!is_array($forms)) {
                        $forms = [];
                    }

                    foreach ($forms as &$form) {
                        if (isset($form['linea']) && isset($lineMap[$form['linea']])) {
                            $form['linea'] = $lineMap[$form['linea']];
                        }
                    }

                    $actividadArr['forms'] = $forms;
                } catch (\Throwable $e) {
                    Log::warning('⚠️ Error al decodificar forms', [
                        'actividad_id' => $actividad->id,
                        'error' => $e->getMessage(),
                    ]);
                    $actividadArr['forms'] = [];
                }

                return $actividadArr;
            });
            // Log::info("📄 Actividades ejecutadas (con forms parseado)", ['actividadesEjecutadas' => $actividadesEje->toArray()]);

            // Log::info("📄 Actividades ejecutadas (con forms parseado + líneas mapeadas)", ['actividadesEjecutadas' => $actividadesEje->toArray()]);

            $masterStages = Stage::whereIn('id', $masterIds)->get();
            // Log::info("🛠 masterStages", ['masterStages' => $masterStages->toArray()]);

            $machines = Machinery::whereIn('id', $machineIds)->get();
            // Log::info("⚙️ Máquinas", ['machines' => $machines->toArray()]);

            $users = User::whereIn('id', $userIds)->get();
            // Log::info("👥 Usuarios", ['users' => $users->toArray()]);

            $timers = Timer::with('timerControls')
                ->where('ejecutada_id', $plan->id)
                ->get();

            // Log::info("⏱️ Timers con controles", $timers->toArray());

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
                'desart' => $desart,
                'timers' => $timers,
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Error en getPlanByIdPDF: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPlanDataForPDF($id)
    {
        try {
            Log::info('📄 getPlanDataForPDF() iniciado', ['adaptation_date_id' => $id]);

            // --- Plan + relaciones base ---
            $plan = AdaptationDate::with('adaptation.maestra')->find($id);
            if (!$plan) {
                Log::warning('❌ Plan no encontrado', ['adaptation_date_id' => $id]);
                return null;
            }

            Log::info('✅ Plan encontrado', [
                'plan_id'        => $plan->id,
                'adaptation_id'  => $plan->adaptation_id ?? null,
                'client_id'      => $plan->adaptation?->client_id,
            ]);

            // --- Cliente / artículo ---
            $clienteId = $plan->adaptation?->client_id;
            $codart    = $plan->codart;
            $maestra   = $plan->adaptation?->maestra;

            $cliente = $clienteId ? Clients::find($clienteId) : null;
            $coddiv  = $cliente->code ?? null;
            $desart  = $coddiv ? ArticleService::getDesartByCodart($coddiv, $codart) : null;

            // --- Conciliaciones: TODAS las filas, más reciente primero ---
            $conciliacionesQuery = Conciliaciones::where('adaptation_date_id', $plan->id);
            if (Schema::hasColumn('conciliaciones', 'updated_at')) {
                $conciliacionesQuery->orderByDesc('updated_at')->orderBy('id');
            } else {
                $conciliacionesQuery->orderBy('id');
            }
            $conciliaciones = $conciliacionesQuery->get();     // 👈 ahora traemos todas
            $conciliacion   = $conciliaciones->first();        // 👈 la más reciente (compatibilidad)

            if ($conciliaciones->isNotEmpty()) {
                Log::info('ℹ️ Conciliaciones encontradas', [
                    'adaptation_date_id' => $plan->id,
                    'total'              => $conciliaciones->count(),
                    'ids'                => $conciliaciones->pluck('id'),
                ]);
            } else {
                Log::info('ℹ️ No hay conciliaciones para el plan', ['adaptation_date_id' => $plan->id]);
            }

            // --- Stages ordenados según type_stage de la maestra ---
            $stageIds = [];
            if ($maestra && isset($maestra->type_stage)) {
                $stageRaw = $maestra->type_stage;
                if (is_string($stageRaw)) {
                    $decoded  = json_decode($stageRaw, true);
                    $stageIds = is_array($decoded) ? $decoded : [];
                } elseif (is_array($stageRaw)) {
                    $stageIds = $stageRaw;
                }
            }

            $stages = collect();
            if (!empty($stageIds)) {
                $stages = Stage::whereIn('id', $stageIds)
                    ->get()
                    ->sortBy(fn($stage) => array_search($stage->id, $stageIds))
                    ->values();
            }

            // --- IDs del plan con casteo seguro a array ---
            $masterIds  = is_array($plan->master)  ? $plan->master  : (is_null($plan->master)  ? [] : [$plan->master]);
            $lineIds    = is_array($plan->line)    ? $plan->line    : (is_null($plan->line)    ? [] : [$plan->line]);
            $machineIds = is_array($plan->machine) ? $plan->machine : (is_null($plan->machine) ? [] : [$plan->machine]);
            $userIds    = is_array($plan->users)   ? $plan->users   : (is_null($plan->users)   ? [] : [$plan->users]);

            $lines        = !empty($lineIds) ? Manufacturing::whereIn('id', $lineIds)->get() : collect();
            $lineMap      = $lines->pluck('name', 'id');
            $machines     = !empty($machineIds) ? Machinery::whereIn('id', $machineIds)->get() : collect();
            $users        = !empty($userIds) ? User::whereIn('id', $userIds)->get() : collect();
            $masterStages = !empty($masterIds) ? Stage::whereIn('id', $masterIds)->get() : collect();

            // --- Orden ejecutada (si existe) ---
            $ordenasEje = OrdenesEjecutadas::where('adaptation_date_id', $plan->id)->first();

            // --- TODAS las actividades ejecutadas del plan ---
            $actividades = ActividadesEjecutadas::where('adaptation_date_id', $plan->id)
                ->when(
                    Schema::hasColumn('actividades_ejecutadas', 'updated_at'),
                    fn($q) => $q->orderByDesc('updated_at'),
                    fn($q) => $q->orderByDesc('id')
                )
                ->get();

            Log::info('📚 Actividades del plan', [
                'adaptation_date_id' => $plan->id,
                'total' => $actividades->count(),
                'ids'   => $actividades->pluck('id'),
            ]);

            // --- Actividades (mapeadas a array) con normalización de 'forms' y líneas por nombre ---
            $actividadesEjecutadas = $actividades->map(function ($actividad) use ($lineMap) {
                $actividadArr = $actividad->toArray();
                try {
                    $forms = json_decode($actividadArr['forms'] ?? '[]', true);
                    if (!is_array($forms)) $forms = [];
                    foreach ($forms as &$form) {
                        if (isset($form['linea']) && isset($lineMap[$form['linea']])) {
                            $form['linea'] = $lineMap[$form['linea']];
                        }
                    }
                    $actividadArr['forms'] = $forms;
                } catch (\Throwable $e) {
                    Log::warning('⚠️ Error al decodificar forms', [
                        'actividad_id' => $actividad->id,
                        'error' => $e->getMessage(),
                    ]);
                    $actividadArr['forms'] = [];
                }
                return $actividadArr;
            });

            Log::info("📚 Actividades del plan", [$actividadesEjecutadas]);

            // =========================
            //  Timers (fuente 1)
            // =========================
            $timers = collect();
            $controlGroups = collect(); // ← lista unificada para PDF

            if ($actividades->isEmpty()) {
                Log::warning('⚠️ No hay actividades ejecutadas para el plan; no se buscarán timers', [
                    'adaptation_date_id' => $plan->id
                ]);
            } else {
                $actividadIds = $actividades->pluck('id');

                Log::info('🔍 Buscando timers para actividades', [
                    'adaptation_date_id' => $plan->id,
                    'actividad_ids'      => $actividadIds,
                ]);

                $timers = Timer::with(['timerControls', 'ejecutada'])
                    ->whereIn('ejecutada_id', $actividadIds)
                    ->get();

                Log::info('⏱️ Timers encontrados', [
                    'total_timers' => $timers->count(),
                ]);

                if ($timers->isEmpty()) {
                    Log::warning('⚠️ No se encontraron timers para las actividades', [
                        'adaptation_date_id' => $plan->id,
                    ]);
                } else {
                    $timersPorActividad = $timers->groupBy('ejecutada_id')->map->count();
                    Log::info('📊 Timers por actividad', $timersPorActividad->toArray());

                    foreach ($timers as $timer) {
                        $fase = $timer->ejecutada->description_fase ?? 'Sin fase';
                        $controlsCount = $timer->timerControls->count();

                        Log::info('🧩 Timer', [
                            'timer_id'      => $timer->id,
                            'ejecutada_id'  => $timer->ejecutada_id,
                            'fase'          => $fase,
                            'controles_total' => $controlsCount,
                            'created_at'    => $timer->created_at,
                            'updated_at'    => $timer->updated_at,
                        ]);

                        foreach ($timer->timerControls as $control) {
                            // Normalizar data → registros[]
                            $data = is_string($control->data) ? json_decode($control->data, true) : $control->data;
                            if (!is_array($data)) $data = [];

                            $registros = [];
                            foreach ($data as $registro) {
                                $tipo = $registro['tipo'] ?? '—';
                                $descripcion = $registro['descripcion'] ?? ($registro['description'] ?? '—');
                                $valor = $registro['valor'] ?? null;
                                $unidad = $registro['unidad'] ?? '';

                                if (is_string($valor) && Str::startsWith($valor, 'data:image')) {
                                    $valor = '[imagen]';
                                }
                                if (is_array($valor)) {
                                    $valor = array_intersect_key($valor, array_flip(['min', 'max', 'valor', 'value']));
                                }
                                if (is_string($descripcion)) {
                                    $descripcion = Str::limit($descripcion, 120);
                                }
                                $registros[] = [
                                    'tipo'        => $tipo,
                                    'descripcion' => $descripcion,
                                    'valor'       => $valor,
                                    'unidad'      => $unidad,
                                ];
                            }

                            $controlGroups->push([
                                'source'      => 'timers',
                                'timer_id'    => $timer->id,
                                'control_id'  => $control->id,
                                'fase'        => $fase,
                                'user'        => $control->user,
                                'registros'   => $registros,
                                'created_at'  => $control->created_at,
                                'updated_at'  => $control->updated_at,
                            ]);

                            Log::info('📋 Control (timer)', [
                                'control_id' => $control->id,
                                'timer_id'   => $timer->id,
                                'registros'  => count($registros),
                            ]);
                        }
                    }
                }
            }

            // =========================
            //  ActividadesControls (fuente 2)
            // =========================
            $acRows = ActividadesControls::where('adaptation_date_id', $plan->id)
                ->when(
                    Schema::hasColumn('actividades_controls', 'updated_at'),
                    fn($q) => $q->orderByDesc('updated_at'),
                    fn($q) => $q->orderByDesc('id')
                )
                ->get();

            Log::info('🧾 ActividadesControls encontradas', [
                'total' => $acRows->count(),
                'ids'   => $acRows->pluck('id'),
            ]);

            $actividadesControls = $acRows->map(function ($ac) use ($lineMap, $controlGroups) {
                // Parsear forms (y su config) con tolerancia
                $formsRaw = $ac->forms;
                try {
                    $forms = is_string($formsRaw) ? json_decode($formsRaw, true) : (is_array($formsRaw) ? $formsRaw : []);
                    if (!is_array($forms)) $forms = [];
                } catch (\Throwable $e) {
                    Log::warning('⚠️ Error al decodificar forms de ActividadesControls', [
                        'ac_id'  => $ac->id,
                        'error'  => $e->getMessage(),
                    ]);
                    $forms = [];
                }

                $registros = [];
                foreach ($forms as $f) {
                    // Línea → nombre
                    if (isset($f['linea']) && isset($lineMap[$f['linea']])) {
                        $f['linea'] = $lineMap[$f['linea']];
                    }

                    // Config puede venir doblemente serializada
                    $cfgRaw = $f['config'] ?? null;
                    $cfg = [];
                    if (is_string($cfgRaw)) {
                        $dec = json_decode($cfgRaw, true);
                        if (is_string($dec)) {
                            $dec = json_decode($dec, true);
                        }
                        if (!$dec) {
                            $try = json_decode(stripslashes(trim($cfgRaw, '"')), true);
                            $dec = is_array($try) ? $try : $dec;
                        }
                        $cfg = is_array($dec) ? $dec : [];
                    } elseif (is_array($cfgRaw)) {
                        $cfg = $cfgRaw;
                    }

                    $valor = $f['value'] ?? ($f['valor'] ?? null);
                    if (is_string($valor) && Str::startsWith($valor, 'data:image')) {
                        $valor = '[imagen]';
                    }
                    if (is_array($valor)) {
                        $valor = array_intersect_key($valor, array_flip(['min', 'max', 'valor', 'value']));
                    }

                    $registros[] = [
                        'tipo'        => $cfg['type'] ?? ($f['type'] ?? '—'),
                        'descripcion' => $f['description'] ?? ($f['descripcion'] ?? '—'),
                        'valor'       => $valor,
                        'unidad'      => $cfg['unit'] ?? ($f['unit'] ?? ''),
                    ];
                }

                // Añadir a la lista unificada
                $controlGroups->push([
                    'source'                 => 'actividades_controls',
                    'actividad_control_id'   => $ac->id,
                    'fase'                   => $ac->descripcion ?? 'Sin fase',
                    'user'                   => isset($ac->user) ? urldecode($ac->user) : null,
                    'registros'              => $registros,
                    'created_at'             => $ac->created_at,
                    'updated_at'             => $ac->updated_at,
                ]);

                return [
                    'id'                  => $ac->id,
                    'adaptation_date_id'  => $ac->id,
                    'fase_id'             => $ac->fase_id,
                    'descripcion'         => $ac->descripcion,
                    'phase_type'          => $ac->phase_type,
                    'user'                => isset($ac->user) ? urldecode($ac->user) : null,
                    'registros'           => $registros,
                    'created_at'          => $ac->created_at,
                    'updated_at'          => $ac->updated_at,
                ];
            });

            // =========================
            //  ActividadesTestigos (firmas)
            // =========================
            $signaturesByActivityId = [];
            foreach ($actividadesEjecutadas as $act) {
                $forms = $act['forms'] ?? [];
                foreach ($forms as $f) {
                    // Config (puede venir 2x serializada)
                    $cfgRaw = $f['config'] ?? null;
                    $cfg = [];
                    if (is_string($cfgRaw)) {
                        $dec = json_decode($cfgRaw, true);
                        if (is_string($dec)) $dec = json_decode($dec, true);
                        if (!$dec) {
                            $try = json_decode(stripslashes(trim($cfgRaw, '"')), true);
                            $dec = is_array($try) ? $try : $dec;
                        }
                        $cfg = is_array($dec) ? $dec : [];
                    } elseif (is_array($cfgRaw)) {
                        $cfg = $cfgRaw;
                    }

                    $type = strtolower($cfg['type'] ?? ($f['type'] ?? ''));
                    if ($type !== 'signature') continue;

                    $actId = $f['actividad_fk'] ?? $f['id_activitie'] ?? $f['id'] ?? null;
                    if ($actId === null) continue;

                    $desc  = $f['description'] ?? ($f['descripcion'] ?? '—');
                    $valor = $f['valor'] ?? ($f['value'] ?? null);

                    $signaturesByActivityId[$actId][] = [
                        'descripcion' => $desc,
                        'valor'       => $valor,
                    ];
                }
            }

            $testigoRows = ActividadesTestigos::where('adaptation_date_id', $plan->id)
                ->when(
                    Schema::hasColumn('actividades_testigos', 'updated_at'),
                    fn($q) => $q->orderByDesc('updated_at'),
                    fn($q) => $q->orderByDesc('id')
                )
                ->get();

            Log::info('🖊️ ActividadesTestigos encontradas', [
                'total' => $testigoRows->count(),
                'ids'   => $testigoRows->pluck('id'),
            ]);

            $testigos = $testigoRows->map(function ($t) use ($signaturesByActivityId, $controlGroups) {
                $formsRaw = $t->forms;
                try {
                    $forms = is_string($formsRaw) ? json_decode($formsRaw, true) : (is_array($formsRaw) ? $formsRaw : []);
                    if (!is_array($forms)) $forms = [];
                } catch (\Throwable $e) {
                    Log::warning('⚠️ Error al decodificar forms de ActividadesTestigos', [
                        'testigo_id' => $t->id,
                        'error'      => $e->getMessage(),
                    ]);
                    $forms = [];
                }

                $registros = [];
                foreach ($forms as $tf) {
                    $actId = $tf['id'] ?? $tf['actividad_id'] ?? $tf['actividad_fk'] ?? null;
                    if ($actId === null) continue;

                    $matches = $signaturesByActivityId[$actId] ?? [];
                    if (empty($matches)) continue;

                    foreach ($matches as $sig) {
                        $registros[] = [
                            'tipo'        => 'signature',
                            'descripcion' => $tf['description'] ?? ($sig['descripcion'] ?? '—'),
                            'valor'       => $sig['valor'] ?? '—',
                            'unidad'      => '',
                        ];
                    }
                }

                if (!empty($registros)) {
                    $controlGroups->push([
                        'source'       => 'testigos',
                        'testigo_id'   => $t->id,
                        'fase'         => $t->descripcion ?? 'TESTIGO',
                        'user'         => isset($t->user) ? urldecode($t->user) : null,
                        'registros'    => $registros,
                        'created_at'   => $t->created_at,
                        'updated_at'   => $t->updated_at,
                    ]);
                }

                return [
                    'id'                  => $t->id,
                    'adaptation_date_id'  => $t->adaptation_date_id,
                    'fase_id'             => $t->fase_id,
                    'descripcion'         => $t->descripcion,
                    'phase_type'          => $t->phase_type,
                    'user'                => isset($t->user) ? urldecode($t->user) : null,
                    'registros'           => $registros,
                    'created_at'          => $t->created_at,
                    'updated_at'          => $t->updated_at,
                ];
            });

            // Orden unificado por updated_at desc (para el PDF)
            $controlGroups = $controlGroups
                ->sortByDesc(fn($g) => $g['updated_at'] ?? $g['created_at'])
                ->values();

            Log::info('🧮 Resumen unificado de controles', [
                'total_groups'     => $controlGroups->count(),
                'timers_groups'    => $controlGroups->where('source', 'timers')->count(),
                'ac_groups'        => $controlGroups->where('source', 'actividades_controls')->count(),
                'testigos_groups'  => $controlGroups->where('source', 'testigos')->count(),
            ]);

            return [
                'plan'                 => $plan,
                'maestra'              => $maestra,
                'cliente'              => $cliente,
                'ordenadas'            => $ordenasEje,
                'actividadesEjecutadas' => $actividadesEjecutadas,
                'stages'               => $stages,
                'masterStages'         => $masterStages,
                'lines'                => $lines,
                'machines'             => $machines,
                'users'                => $users,
                'desart'               => $desart,
                'timers'               => $timers,
                'actividadesControls'  => $actividadesControls,
                'testigos'             => $testigos,
                'controlGroups'        => $controlGroups,
                'conciliacion'         => $conciliacion,     // la más reciente (compat)
                'conciliaciones'       => $conciliaciones,   // 👈 TODAS para renderizar
            ];
        } catch (\Throwable $e) {
            Log::error('💥 Error en getPlanDataForPDF', [
                'adaptation_date_id' => $id,
                'error'              => $e->getMessage(),
                'trace'              => Str::limit($e->getTraceAsString(), 2000),
            ]);
            return null;
        }
    }

    public function generatePDFView($id)
    {
        $data = $this->getPlanDataForPDF($id);
        if (!$data) {
            return response()->json(['error' => 'Plan not found'], 404);
        }

        $options = new Options();
        $options->set('defaultFont', 'Georgia');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', true);

        $dompdf = new Dompdf($options);

        $numberOrder = $data['plan']->number_order;
        $clienteRaw  = $data['cliente']->name ?? 'Cliente';
        $clienteName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $clienteRaw);
        $pdfTitle    = "Orden {$numberOrder} — {$clienteRaw}";

        // Tu Blade ya lleva <title> … </title> (bien)
        $html = view('pdf.plan', array_merge($data, ['__pdfTitle' => $pdfTitle]))->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $mainPdfBytes = $dompdf->output();

        // 🔒 FUSIONA + SELLA METADATA EN EL PDF FINAL
        $finalBytes = $this->pdfService->mergeWithAttachmentsAndMetadata(
            $mainPdfBytes,
            $numberOrder,
            $pdfTitle,
            'Logismart',
            'Orden de producción'
        );

        $downloadName = 'Orden_' . $numberOrder . '_' . $clienteName . '.pdf';

        return response($finalBytes, 200)
            ->header('Content-Type', 'application/pdf')
            ->header(
                'Content-Disposition',
                'inline; filename="' . $downloadName . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName)
            );
    }

    public function testImage()
    {
        $path = public_path('images/pharex.png');

        if (!file_exists($path)) {
            dd('❌ Imagen no encontrada en: ' . $path);
        }

        $info = getimagesize($path);
        dd([
            'path' => $path,
            'mime' => $info['mime'],
            'size' => filesize($path),
        ]);
    }

    public function getConsultPlanning()
    {
        try {
            $planning = AdaptationDate::all();

            $formatted = $planning->map(function ($plan) {
                // Cliente y planta
                $clientName = optional(Clients::find($plan->client_id))->name;
                $factory = optional(Factory::find($plan->factory_id))->name;

                // Relaciones múltiples (asegura que son arrays antes de consultar)
                $line = is_array($plan->line)
                    ? Manufacturing::whereIn('id', $plan->line)->pluck('id')
                    : collect();

                $machines = is_array($plan->machine)
                    ? Machinery::whereIn('id', $plan->machine)->pluck('id')
                    : collect();

                $users = is_array($plan->users)
                    ? User::whereIn('id', $plan->users)->pluck('id')
                    : collect();

                // Actividades complejas
                $rawActivities = $plan->activities;
                if (is_string($rawActivities)) {
                    $decoded = json_decode($rawActivities, true);
                    $activities = is_array($decoded) ? $decoded : [];
                } elseif (is_array($rawActivities)) {
                    $activities = $rawActivities;
                } else {
                    $activities = [];
                }

                // Desglose de duración
                $durationBreakdown = is_array($plan->duration_breakdown) ? $plan->duration_breakdown : [];

                return [
                    'id' => $plan->id,
                    'client_id' => $plan->client_id,
                    'client_name' => $clientName,
                    'factory_id' => $plan->factory_id,
                    'factory' => $factory,
                    'master' => $plan->master,
                    'bom' => $plan->bom,
                    'number_order' => $plan->number_order,
                    'codart' => $plan->codart,
                    'orderNumber' => $plan->orderNumber,
                    'orderType' => $plan->orderType,
                    'deliveryDate' => $plan->deliveryDate,
                    'quantityToProduce' => $plan->quantityToProduce,
                    'lot' => $plan->lot,
                    'healthRegistration' => $plan->healthRegistration,
                    'ingredients' => $plan->ingredients,
                    'adaptation_id' => $plan->adaptation_id,
                    'status_dates' => $plan->status_dates,
                    'line' => $line,
                    'machine' => $machines,
                    'users' => $users,
                    'activities' => $activities,
                    'resource' => $plan->resource,
                    'color' => $plan->color,
                    'icon' => $plan->icon,
                    'duration' => $plan->duration,
                    'duration_breakdown' => $durationBreakdown,
                    'start_date' => $plan->start_date,
                    'end_date' => $plan->end_date,
                    'clock' => $plan->clock,
                    'pause' => $plan->pause,
                    'finish_notificade' => $plan->finish_notificade,
                    'out' => $plan->out,
                    'user' => $plan->user,
                    'created_at' => $plan->created_at,
                    'updated_at' => $plan->updated_at,
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener planificación:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Error al obtener planificación'], 500);
        }
    }
}
