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
use App\Models\Stage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;


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
                'master' => 'nullable|exists:maestras,id',
                'bom'    => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|json',
                'number_order' => 'required|string',
                'factory_id'   => 'required|exists:factories,id',
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

            $articleAttachments = [];
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = 'general_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('attachments', $filename, 'public');
                $articleAttachments['general'] = $path;
                // Log::info('📎 Archivo general adjuntado', ['path' => $path]);
            }

            foreach ($request->files as $key => $file) {
                if (Str::startsWith($key, 'attachment_')) {
                    $codart = Str::after($key, 'attachment_');

                    if (!$file instanceof LaravelUploadedFile && $file instanceof SymfonyUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }

                    $safeCodart = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $codart);
                    $filename = $safeCodart . '_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');
                    $articleAttachments[$codart] = $path;

                    // Log::info("📎 Archivo adjuntado para artículo {$codart}", ['path' => $path]);
                }
            }

            if (!empty($articleAttachments)) {
                $validatedData['attachment'] = json_encode($articleAttachments);
            }

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
                        'fase' => 'TOTAL',
                        'resultado' => $totalDuration,
                    ];
                    $masterDuration = $totalDuration;

                    // Log::info('📐 Duración calculada por etapas', [
                    //     'masterDuration' => $masterDuration,
                    //     'desglose' => $duration_breakdown
                    // ]);
                }
            }

            $articleCodes = json_decode($validatedData['article_code'], true);
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
                    'duration_breakdown' => json_encode($duration_breakdown),
                ]);
                // Log::info('📅 AdaptationDate creada para artículo', ['codart' => $article['codart']]);
            }

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
                'article_files' => $articleAttachments,
            ], 201);
        } catch (ValidationException $e) {
            // Log::warning('❌ Fallo de validación', ['errors' => $e->errors()]);
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            // Log::error('🔥 Error inesperado al guardar la adaptación', [
            //     'message' => $e->getMessage(),
            //     'trace' => $e->getTraceAsString(),
            // ]);
            return response()->json([
                'error'   => 'Error saving adaptation',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getAdaptation(Request $request)
    {
        try {
            $adaptations = Adaptation::all();

            return response()->json([
                'adaptations' => $adaptations
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error retrieving adaptations',
                'details' => $e->getMessage()
            ], 500);
        }
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
            $adaptation = Adaptation::findOrFail($id);

            $validatedData = $request->validate([
                'client_id'    => 'required|exists:clients,id',
                'factory_id'   => 'required|exists:factories,id',
                'article_code' => 'required|json',
                'number_order' => 'required|string',
                'attachment'   => 'nullable|file',
                'master'       => 'nullable|exists:maestras,id',
                'bom'          => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|json',
            ]);

            // Procesar adjuntos individuales
            $articleAttachments = [];
            $oldAttachments = json_decode($adaptation->attachment, true) ?? [];

            foreach ($request->files as $key => $file) {
                if (Str::startsWith($key, 'attachment_')) {
                    $codart = Str::after($key, 'attachment_');

                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }

                    // Borrar adjunto antiguo si existe
                    if (isset($oldAttachments[$codart])) {
                        Storage::disk('public')->delete($oldAttachments[$codart]);
                    }

                    $safeCodart = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $codart);
                    $filename = $safeCodart . '_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');
                    $articleAttachments[$codart] = $path;
                }
            }

            // Procesar adjunto general
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');

                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }

                // Si el attachment anterior era JSON con múltiples archivos, borrar todos
                if (is_string($adaptation->attachment)) {
                    $oldAttachmentData = json_decode($adaptation->attachment, true);
                    if (is_array($oldAttachmentData)) {
                        foreach ($oldAttachmentData as $oldFilePath) {
                            Storage::disk('public')->delete($oldFilePath);
                        }
                    } else {
                        Storage::disk('public')->delete($adaptation->attachment);
                    }
                }

                $filename = 'general_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('attachments', $filename, 'public');
                $articleAttachments['general'] = $filePath;
            }

            // Si hay adjuntos, codificarlos en JSON para guardar en DB
            if (!empty($articleAttachments)) {
                $validatedData['attachment'] = json_encode($articleAttachments);
            }

            // Decodificar JSON si vienen como string
            $validatedData['ingredients'] = isset($validatedData['ingredients']) ? json_decode($validatedData['ingredients'], true) : null;

            // Duración y desglose
            $masterDuration = null;
            $duration_breakdown = [];

            if (!empty($validatedData['master'])) {
                $master = Maestra::find($validatedData['master']);
                $ingredients = $validatedData['ingredients'] ?? [];

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

                        $duracionEtapa = 0;
                        $multiplicacion = null;

                        if ($stage->multi) {
                            $duracionEtapa = $stage->duration * $teoricaTotal;
                            $multiplicacion = "{$stage->duration} * {$teoricaTotal}";
                        } else {
                            $duracionEtapa = $stage->duration;
                        }

                        $totalDuration += $duracionEtapa;

                        $duration_breakdown[] = [
                            'fase'           => $stage->description,
                            'multi'          => $stage->multi,
                            'duracion_base'  => $stage->duration,
                            'teorica_total'  => $stage->multi ? $teoricaTotal : null,
                            'multiplicacion' => $multiplicacion,
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

            // Guardar desglose y duración en validatedData
            $validatedData['duration_breakdown'] = json_encode($duration_breakdown);
            $validatedData['duration'] = $masterDuration;

            $articleCodes = json_decode($validatedData['article_code'], true);

            foreach ($articleCodes as $article) {
                AdaptationDate::updateOrCreate(
                    [
                        'adaptation_id' => $adaptation->id,
                        'codart'       => $article['codart'],
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
                'message'    => 'Adaptation updated successfully',
                'adaptation' => $adaptation,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error updating adaptation',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteAdaptation($id)
    {
        try {
            $adaptation = Adaptation::findOrFail($id);
            AdaptationDate::where('adaptation_id', $adaptation->id)->delete();
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
}