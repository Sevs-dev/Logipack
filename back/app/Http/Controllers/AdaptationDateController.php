<?php

namespace App\Http\Controllers;

use App\Models\ActividadesEjecutadas;
use App\Models\AdaptationDate;
use App\Models\Clients;
use App\Models\Factory;
use App\Models\Machinery;
use App\Models\Manufacturing;
use App\Models\OrdenesEjecutadas;
use App\Models\Stage;
use App\Models\Timer;
use App\Models\User;
use App\Services\ArticleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Dompdf\Dompdf;
use Dompdf\Options;

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
                'error'   => 'Error retrieving plan',
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
                'error'   => 'Error retrieving plan',
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
                $actividadArr = $actividad->toArray(); // ✅ ya no es modelo, sino array simple

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
                    Log::warning("⚠️ Error al decodificar forms", [
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
            Log::error("💥 Error en getPlanByIdPDF: " . $e->getMessage());
            return response()->json([
                'error' => 'Error retrieving plan',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
    public function getPlanDataForPDF($id)
    {
        try {
            $plan = AdaptationDate::with('adaptation.maestra')->find($id);
            if (!$plan) {
                Log::warning("❌ Plan no encontrado para ID: $id");
                return null;
            }
            $cliente = $plan->adaptation?->client_id;
            $codart = $plan->codart;
            $maestra = $plan->adaptation?->maestra;
            $clientes = Clients::where('id', $cliente)->first();
            $coddiv = $clientes->code ?? null;
            $desart = $coddiv ? ArticleService::getDesartByCodart($coddiv, $codart) : null;
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
            $stages = Stage::whereIn('id', $stageIds)->get();
            $stages = $stages->sortBy(function ($stage) use ($stageIds) {
                return array_search($stage->id, $stageIds);
            })->values();

            $masterIds = is_array($plan->master) ? $plan->master : (is_null($plan->master) ? [] : [$plan->master]);
            $lineIds = is_array($plan->line) ? $plan->line : (is_null($plan->line) ? [] : [$plan->line]);
            $machineIds = is_array($plan->machine) ? $plan->machine : (is_null($plan->machine) ? [] : [$plan->machine]);
            $userIds = is_array($plan->users) ? $plan->users : (is_null($plan->users) ? [] : [$plan->users]);
            $lines = Manufacturing::whereIn('id', $lineIds)->get();
            $lineMap = $lines->pluck('name', 'id');
            $ordenasEje = OrdenesEjecutadas::where('adaptation_date_id', $plan->id)->first();
            $actividadesEje = ActividadesEjecutadas::where('adaptation_date_id', $plan->id)->get();
            $actividadesEje = $actividadesEje->map(function ($actividad) use ($lineMap) {
                $actividadArr = $actividad->toArray();
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
                    Log::warning("⚠️ Error al decodificar forms", [
                        'actividad_id' => $actividad->id,
                        'error' => $e->getMessage(),
                    ]);
                    $actividadArr['forms'] = [];
                }
                return $actividadArr;
            });
            $masterStages = Stage::whereIn('id', $masterIds)->get();
            $machines = Machinery::whereIn('id', $machineIds)->get();
            $users = User::whereIn('id', $userIds)->get();

            $timers = Timer::with('timerControls')
                ->where('ejecutada_id', $plan->id)
                ->get();
            Log::info("🔍 Verificando ID de plan para timers", ['plan_id' => $plan->id]);
            Log::info("✅ Datos cargados exitosamente para PDF", ['timers' => $timers->toArray()]);

            return [
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
            ];
        } catch (\Exception $e) {
            Log::error("💥 Error en getPlanDataForPDF: " . $e->getMessage());
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
        $options->set('isPhpEnabled', true); // No usar si vamos sin <script>

        $dompdf = new Dompdf($options);

        $html = view('pdf.plan', $data)->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // ✅ Inserta la paginación después de renderizar
        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('Georgia', 'normal');

        $canvas->page_script(function ($pageNumber, $pageCount, $canvas, $fontMetrics) use ($font) {
            $text = "Página $pageNumber de $pageCount";
            $fontSize = 10;
            $width = $fontMetrics->getTextWidth($text, $font, $fontSize);
            $x = 520 - $width; // izquierda si querés mover
            $y = 25;
            $canvas->text($x, $y, $text, $font, $fontSize);
        });

        return response($dompdf->output(), 200)
            ->header('Content-Type', 'application/pdf');
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
                $activities = is_array($plan->activities) ? $plan->activities : [];

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