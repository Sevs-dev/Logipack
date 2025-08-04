<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Adaptation;
use App\Models\Maestra;
use App\Models\AdaptationDate;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile as LaravelUploadedFile;
use Symfony\Component\HttpFoundation\File\UploadedFile as SymfonyUploadedFile;
use App\Models\Consecutive;
use App\Models\Consecutive_date;
use App\Models\Factory;
use App\Models\Stage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Models\OrdenesEjecutadas;



class AdaptationController extends Controller
{
    public function newAdaptation(Request $request)
    {
        try {
           // Log::info('🔄 Iniciando creación de nueva adaptación', ['request' => $request->all()]);

            $validatedData = $request->validate([
                'client_id'    => 'required|exists:clients,id',
                'article_code' => 'required|json',
                'attachment'   => 'nullable|file',
                'master'       => 'nullable|exists:maestras,id',
                'bom'          => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|json',
                'number_order' => 'required|string',
                'factory_id'   => 'required|exists:factories,id',
                'user'         => 'string|nullable',
            ]);

           // Log::info('✅ Datos validados correctamente', ['validated' => $validatedData]);

            $now = Carbon::now();
            $prefix = Str::before($validatedData['number_order'], '-');
            $currentYear = $now->year;
            $currentMonth = $now->format('m');

            $consecutive = Consecutive::firstOrNew(['prefix' => $prefix]);
            if ($consecutive->year != $currentYear || $consecutive->month != $currentMonth) {
               // Log::info('🆕 Reiniciando consecutivo para nuevo año/mes', ['prefix' => $prefix]);
                $consecutive->year = $currentYear;
                $consecutive->month = $currentMonth;
                $consecutive->consecutive = '0000000';
            } else {
                $consecutive->consecutive = str_pad((int)$consecutive->consecutive + 1, 7, '0', STR_PAD_LEFT);
               // Log::info('🔢 Consecutivo actualizado', ['consecutive' => $consecutive->consecutive]);
            }

            $consecutive->save();

            $newNumberOrder = sprintf(
                '%s-%04d-%02d-%07d',
                $prefix,
                $consecutive->year,
                $consecutive->month,
                $consecutive->consecutive
            );
            $validatedData['number_order'] = $newNumberOrder;

           // Log::info('📝 Nuevo número de orden generado', ['number_order' => $newNumberOrder]);

            // Procesar attachment general (único)
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');

                // Usa el nuevo número de orden generado
                $filename = $newNumberOrder . '_general.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('attachments', $filename, 'public');

                $validatedData['attachment'] = $path;

               // Log::info('📎 Archivo general adjuntado', ['path' => $path]);
            }


            // Procesar attachments individuales (NO guardar en Adaptation)
            $articleAttachments = [];

            foreach ($request->files as $key => $file) {
                if (Str::startsWith($key, 'attachment_')) {
                    $codart = Str::after($key, 'attachment_');

                    if (!$file instanceof LaravelUploadedFile && $file instanceof SymfonyUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }

                    $safeCodart = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $codart);

                    // 📁 Archivo nombrado con el número de orden + codart
                    $filename = $newNumberOrder . '_' . $safeCodart . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');

                    $articleAttachments[$codart] = $path;

                   // Log::info("📎 Archivo adjuntado para artículo {$codart}", ['path' => $path]);
                }
            }

            // Crear Adaptation
            $validatedData['version'] = '1';
            $validatedData['reference_id'] = (string) Str::uuid();
            $adaptation = Adaptation::create($validatedData);

           // Log::info('🧾 Adaptación creada', ['adaptation_id' => $adaptation->id]);

            $masterDuration = null;
            $duration_breakdown = [];

            if (!empty($validatedData['master'])) {
                $master = Maestra::find($validatedData['master']);
                $ingredients = json_decode($validatedData['ingredients'], true) ?? [];

               // Log::info('🍳 Ingredientes recibidos', ['ingredients' => $ingredients]);

                if ($master && is_array($master->type_stage)) {
                    $totalDuration = 0;
                    $teoricaTotal = 0;

                    foreach ($ingredients as $ing) {
                        if (isset($ing['teorica'])) {
                            $teoricaTotal += floatval($ing['teorica']);
                        }
                    }

                    foreach ($master->type_stage as $stageId) {
                        $stage = Stage::find($stageId);
                        if (!$stage) continue;

                        $duracionEtapa = $stage->multi ? $stage->duration * $teoricaTotal : $stage->duration;
                        $totalDuration += $duracionEtapa;

                        $duration_breakdown[] = [
                            'fase'           => $stage->description,
                            'multi'          => $stage->multi,
                            'duracion_base'  => $stage->duration,
                            'teorica_total'  => $stage->multi ? $teoricaTotal : null,
                            'multiplicacion' => $stage->multi ? "{$stage->duration} * {$teoricaTotal}" : null,
                            'resultado'      => $duracionEtapa,
                        ];
                    }

                    $duration_breakdown[] = [
                        'fase'      => 'TOTAL',
                        'resultado' => $totalDuration,
                    ];
                    $masterDuration = $totalDuration;

                   // Log::info('📐 Duración calculada por etapas', [
                    //     'masterDuration' => $masterDuration,
                    //     'desglose'       => $duration_breakdown
                    // ]);
                }
            }

            // Crear AdaptationDate
            $articleCodes = json_decode($validatedData['article_code'], true);
            $factory = Factory::find($validatedData['factory_id']);
            if (!$factory) {
                return response()->json(['error' => 'Fábrica no encontrada'], 404);
            }
            $factoryName = $factory->name;
            foreach ($articleCodes as $article) {
                AdaptationDate::create([
                    'client_id'           => $validatedData['client_id'],
                    'factory_id'          => $validatedData['factory_id'],
                    'codart'              => $article['codart'],
                    'number_order'        => $validatedData['number_order'],
                    'orderNumber'         => $article['orderNumber'],
                    'deliveryDate'        => $article['deliveryDate'],
                    'quantityToProduce'   => $article['quantityToProduce'],
                    'lot'                 => $article['lot'],
                    'healthRegistration'  => $article['healthRegistration'],
                    'master'              => $validatedData['master'],
                    'bom'                 => $validatedData['bom'],
                    'ingredients'         => $validatedData['ingredients'],
                    'adaptation_id'       => $adaptation->id,
                    'duration'            => $masterDuration,
                    'factory'             => $factoryName,
                    'duration_breakdown'  => json_encode($duration_breakdown),
                    'user'                => $adaptation->user,
                ]);
               // Log::info('📅 AdaptationDate creada para artículo', ['codart' => $article['codart']]);
            }

            // Consecutive_date
            Consecutive_date::create([
                'prefix'         => $prefix,
                'year'           => $currentYear,
                'month'          => $currentMonth,
                'consecutive'    => $consecutive->consecutive,
                'date'           => now()->toDateString(),
                'user'           => $request->input('user', 'sistema'),
                'adaptation_id'  => $adaptation->id,
                'status'         => true,
            ]);

           // Log::info('🗂️ Consecutive_date registrada');

            return response()->json([
                'message'       => 'Adaptation saved successfully',
                'number_order'  => $newNumberOrder,
                'adaptation'    => $adaptation,
                'article_files' => $articleAttachments, // Los attachments individuales se devuelven en response, no se guardan en DB
            ], 201);
        } catch (ValidationException $e) {
            Log::warning('❌ Fallo de validación', ['errors' => $e->errors()]);
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('🔥 Error inesperado al guardar la adaptación', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error'   => 'Error saving adaptation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getAdaptation(Request $request)
    {

        $adaptations = Adaptation::where('active', true)
            ->whereIn('version', function ($query) {
                $query->selectRaw('MAX(version)')
                    ->from('adaptations as a2')
                    ->whereColumn('a2.reference_id', 'adaptations.reference_id');
            })
            ->get();

        return response()->json($adaptations, 200);
    }

    public function getAdaptationById($id)
    {
        try {
            $adaptation = Adaptation::findOrFail($id);

            return response()->json([
                'adaptation' => $adaptation
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Adaptation not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error retrieving adaptation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function updateAdaptation(Request $request, $id)
    {
        try {
           // Log::info("🔧 Iniciando actualización de adaptación ID: {$id}");

            $adaptation = Adaptation::findOrFail($id);

            $validatedData = $request->validate([
                'client_id'    => 'required|exists:clients,id',
                'factory_id'   => 'required|exists:factories,id',
                'article_code' => 'required|string',
                'number_order' => 'required|string',
                'attachment'   => 'nullable|file',
                'master'       => 'nullable|exists:maestras,id',
                'bom'          => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|string',
            ]);

           // Log::info("📥 Payload recibido: ", $request->all());
           // Log::info("✅ Datos validados: ", $validatedData);

            $validatedData['article_code'] = json_decode($validatedData['article_code'], true);
            $validatedData['ingredients'] = isset($validatedData['ingredients'])
                ? json_decode($validatedData['ingredients'], true)
                : null;

           // Log::info("📦 article_code decodificado: ", $validatedData['article_code']);
           // Log::info("🥕 ingredients decodificados: ", $validatedData['ingredients'] ?? []);

            $articleAttachments = [];

            foreach ($request->files as $key => $file) {
                if (Str::startsWith($key, 'attachment_')) {
                    $codart = Str::after($key, 'attachment_');

                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }

                    $safeCodart = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $codart);
                    $filename = $safeCodart . '_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');
                    $articleAttachments[$codart] = $path;
                }
            }

            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');

                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }

                if (!empty($adaptation->attachment)) {
                    Storage::disk('public')->delete($adaptation->attachment);
                }

                $filename = 'general_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('attachments', $filename, 'public');
                $validatedData['attachment'] = $filePath;
            }

            // Cálculo de duración y desglose
            $masterDuration = null;
            $duration_breakdown = [];

            if (!empty($validatedData['master'])) {
                $master = Maestra::find($validatedData['master']);
                $ingredients = $validatedData['ingredients'] ?? [];

                if ($master && is_array($master->type_stage)) {
                    $totalDuration = 0;
                    $teoricaTotal = collect($ingredients)->sum(fn($i) => floatval($i['teorica'] ?? 0));

                    foreach ($master->type_stage as $stageId) {
                        $stage = Stage::find($stageId);
                        if (!$stage) continue;

                        $duracionEtapa = $stage->multi ? $stage->duration * $teoricaTotal : $stage->duration;
                        $totalDuration += $duracionEtapa;

                        $duration_breakdown[] = [
                            'fase'           => $stage->description,
                            'multi'          => $stage->multi,
                            'duracion_base'  => $stage->duration,
                            'teorica_total'  => $stage->multi ? $teoricaTotal : null,
                            'multiplicacion' => $stage->multi ? "{$stage->duration} * {$teoricaTotal}" : null,
                            'resultado'      => $duracionEtapa,
                        ];
                    }

                    $duration_breakdown[] = [
                        'fase'      => 'TOTAL',
                        'resultado' => $totalDuration,
                    ];

                    $masterDuration = $totalDuration;
                }
            }

           // Log::info("⏱ Duración calculada: ", ['total' => $masterDuration, 'desglose' => $duration_breakdown]);

            // Actualizar solo campos válidos en Adaptation
            $adaptation->update([
                'client_id'    => $validatedData['client_id'],
                'factory_id'   => $validatedData['factory_id'],
                'article_code' => json_encode($validatedData['article_code']),
                'number_order' => $validatedData['number_order'],
                'attachment'   => $validatedData['attachment'] ?? $adaptation->attachment,
                'master'       => $validatedData['master'],
                'bom'          => $validatedData['bom'],
                'ingredients'  => json_encode($validatedData['ingredients']),
            ]);

            // Actualizar AdaptationDate
            foreach ($validatedData['article_code'] as $article) {
                AdaptationDate::updateOrCreate(
                    [
                        'adaptation_id' => $adaptation->id,
                        'codart'        => $article['codart'],
                    ],
                    [
                        'client_id'           => $validatedData['client_id'],
                        'factory_id'          => $validatedData['factory_id'],
                        'number_order'        => $validatedData['number_order'],
                        'orderNumber'         => $article['orderNumber'],
                        'deliveryDate'        => $article['deliveryDate'],
                        'quantityToProduce'   => $article['quantityToProduce'],
                        'lot'                 => $article['lot'],
                        'healthRegistration'  => $article['healthRegistration'],
                        'master'              => $validatedData['master'],
                        'bom'                 => $validatedData['bom'],
                        'ingredients'         => $validatedData['ingredients'],
                        'duration'            => $masterDuration,
                        'duration_breakdown'  => json_encode($duration_breakdown),
                    ]
                );
            }

            return response()->json([
                'message'       => 'Adaptation updated successfully',
                'adaptation'    => $adaptation,
                'article_files' => $articleAttachments,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::warning("🔥 Error inesperado en updateAdaptation: " . $e->getMessage());
            return response()->json([
                'error'   => 'Error updating adaptation',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteAdaptation($id)
    {
        try {
            // Buscar la adaptación
            $adaptation = Adaptation::findOrFail($id);

            // Actualizar estado de las ordenes ejecutadas
            OrdenesEjecutadas::where('adaptation_id', $adaptation->id)->update([
                'estado' => '-11000',
            ]);

            // Eliminar las fechas de adaptación
            AdaptationDate::where('adaptation_id', $adaptation->id)->delete();

            // Eliminar la adaptación
            $adaptation->delete();

            return response()->json([
                'message' => 'Adaptation and related dates deleted successfully'
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Adaptation not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error deleting adaptation',
                'details' => $e->getMessage()
            ], 500);
        }
    }



    public function debugBomAndIngredients($id)
    {
        $adaptation = Adaptation::find($id);

        if (!$adaptation) {
            return response()->json([
                'error' => 'Adaptation not found',
                'adaptation_id' => $id,
            ], 404);
        }

        // Convertir en array si vienen como JSON string
        $bom = is_string($adaptation->bom) ? json_decode($adaptation->bom, true) : $adaptation->bom;
        $ingredients = is_string($adaptation->ingredients) ? json_decode($adaptation->ingredients, true) : $adaptation->ingredients;

        return response()->json([
            'adaptation_id' => $adaptation->id,
            'bom'           => $bom ?? 'No válido o vacío',
            'ingredients'   => $ingredients ?? 'No válido o vacío',
        ]);
    }
}