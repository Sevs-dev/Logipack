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
                'attachment'   => 'nullable|file',      // adjunto general (opcional)
                'attachments'  => 'nullable',           // soporte opcional para múltiples generales
                'master'       => 'nullable|exists:maestras,id',
                'bom'          => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|json',
                'number_order' => 'required|string',
                'factory_id'   => 'required|exists:factories,id',
                'user'         => 'string|nullable',
            ]);

            // Consecutivo
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

            // ✅ Adjuntos generales (comportamiento universal)
            // 1) Soporte múltiples generales: attachments[]
            $generalFiles = [];
            if ($request->hasFile('attachments')) {
                foreach ((array) $request->file('attachments') as $idx => $file) {
                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }
                    $filename = $newNumberOrder . "_general_{$idx}." . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');
                    $generalFiles[] = $path;
                }
            }

            // 2) Adjunto general único: attachment
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }
                $filename = $newNumberOrder . '_general.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('attachments', $filename, 'public');
                $validatedData['attachment'] = $path;
                // Log::info('📎 Archivo general adjuntado', ['path' => $path]);
            } elseif (!empty($generalFiles)) {
                // Si solo vinieron múltiples, fija el primero como "attachment" para guardar en Adaptation
                $validatedData['attachment'] = $generalFiles[0];
            }

            // ✅ Adjuntos por artículo (siempre disponibles)
            $articleAttachments = [];
            foreach ($request->files as $key => $file) {
                if (!Str::startsWith($key, 'attachment_')) {
                    continue; // ignora 'attachments' y otros
                }

                // $key = 'attachment_{codart}'
                $codart = Str::after($key, 'attachment_');

                // Puede llegar array si mandan múltiples por artículo; normalízalo
                $filesForArticle = is_array($file) ? $file : [$file];

                foreach ($filesForArticle as $fa) {
                    if ($fa instanceof SymfonyUploadedFile && !$fa instanceof LaravelUploadedFile) {
                        $fa = LaravelUploadedFile::createFromBase($fa);
                    }
                    $safeCodart = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $codart);
                    $filename = $newNumberOrder . '_' . $safeCodart . '.' . $fa->getClientOriginalExtension();
                    $path = $fa->storeAs('attachments', $filename, 'public');

                    // Si llegan varios para el mismo codart, conservamos el último (o podrías acumular en array)
                    $articleAttachments[$codart] = $path;
                    // Log::info("📎 Archivo adjuntado para artículo {$codart}", ['path' => $path]);
                }
            }

            // Crear Adaptation
            $validatedData['version'] = '1';
            $validatedData['reference_id'] = (string) Str::uuid();
            $adaptation = Adaptation::create($validatedData);
            // Log::info('🧾 Adaptación creada', ['adaptation_id' => $adaptation->id]);

            // Duración por master/etapas (opcional, sin cambios de lógica)
            $masterDuration = null;
            $duration_breakdown = [];

            if (!empty($validatedData['master'])) {
                $master = Maestra::find($validatedData['master']);
                $ingredients = json_decode($validatedData['ingredients'] ?? '[]', true) ?? [];

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

                        $duracionEtapa = $stage->multi ? $stage->duration_user * $teoricaTotal : $stage->duration_user;
                        $totalDuration += $duracionEtapa;

                        $duration_breakdown[] = [
                            'fase'           => $stage->description,
                            'multi'          => $stage->multi,
                            'duracion_base'  => $stage->duration_user,
                            'teorica_total'  => $stage->multi ? $teoricaTotal : null,
                            'multiplicacion' => $stage->multi ? "{$stage->duration_user} * {$teoricaTotal}" : null,
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

            // Crear AdaptationDate (uno por artículo)
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
                'message'        => 'Adaptation saved successfully',
                'number_order'   => $newNumberOrder,
                'adaptation'     => $adaptation,
                'article_files'  => $articleAttachments,
                'general_files'  => $generalFiles, // opcional: listado de attachments[]
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
                'attachments'  => 'nullable', // soporte múltiples
                'master'       => 'nullable|exists:maestras,id',
                'bom'          => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|string',
            ]);

            // Normaliza estructuras
            $validatedData['article_code'] = json_decode($validatedData['article_code'], true);
            $validatedData['ingredients'] = isset($validatedData['ingredients'])
                ? json_decode($validatedData['ingredients'], true)
                : null;

            // ✅ Adjuntos por artículo (siempre)
            $articleAttachments = [];
            foreach ($request->files as $key => $file) {
                if (!Str::startsWith($key, 'attachment_')) {
                    continue;
                }
                $codart = Str::after($key, 'attachment_');
                $filesForArticle = is_array($file) ? $file : [$file];

                foreach ($filesForArticle as $fa) {
                    if ($fa instanceof SymfonyUploadedFile && !$fa instanceof LaravelUploadedFile) {
                        $fa = LaravelUploadedFile::createFromBase($fa);
                    }
                    $safeCodart = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $codart);
                    $baseOrder = $validatedData['number_order'] ?? $adaptation->number_order;
                    $filename = "{$baseOrder}_{$safeCodart}." . $fa->getClientOriginalExtension();
                    $path = $fa->storeAs('attachments', $filename, 'public');
                    $articleAttachments[$codart] = $path;
                }
            }

            Log::info("📎 Archivos adjuntos por artículo procesados", ['article_attachments' => $articleAttachments]);

            // ✅ Adjuntos generales
            // 1) múltiples (attachments[])
            $generalFiles = [];
            if ($request->hasFile('attachments')) {
                foreach ((array) $request->file('attachments') as $idx => $file) {
                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }
                    $baseOrder = $validatedData['number_order'] ?? $adaptation->number_order ?? 'order';
                    $filename = "{$baseOrder}_general_{$idx}." . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');
                    $generalFiles[] = $path;
                }
            }

            // 2) único (attachment) — reemplaza el anterior
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }

                if (!empty($adaptation->attachment)) {
                    Storage::disk('public')->delete($adaptation->attachment);
                }

                $baseOrder = $validatedData['number_order'] ?? $adaptation->number_order ?? 'order';
                $filename = "{$baseOrder}_general." . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('attachments', $filename, 'public');
                $validatedData['attachment'] = $filePath;
            } elseif (!empty($generalFiles)) {
                // Si mandaron múltiples pero no 'attachment', podemos (opcional) fijar el primero como attachment
                $validatedData['attachment'] = $generalFiles[0];
            } else {
                // Mantener el existente si no enviaron nada
                $validatedData['attachment'] = $adaptation->attachment;
            }

            // Cálculo de duración (sin cambios funcionales)
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

                        $duracionEtapa = $stage->multi ? $stage->duration_user * $teoricaTotal : $stage->duration_user;
                        $totalDuration += $duracionEtapa;

                        $duration_breakdown[] = [
                            'fase'           => $stage->description,
                            'multi'          => $stage->multi,
                            'duracion_base'  => $stage->duration_user,
                            'teorica_total'  => $stage->multi ? $teoricaTotal : null,
                            'multiplicacion' => $stage->multi ? "{$stage->duration_user} * {$teoricaTotal}" : null,
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

            // Actualizar Adaptation
            $adaptation->update([
                'client_id'    => $validatedData['client_id'],
                'factory_id'   => $validatedData['factory_id'],
                'article_code' => json_encode($validatedData['article_code']),
                'number_order' => $validatedData['number_order'],
                'attachment'   => $validatedData['attachment'], // ya normalizado arriba
                'master'       => $validatedData['master'],
                'bom'          => $validatedData['bom'],
                'ingredients'  => json_encode($validatedData['ingredients']),
            ]);

            // Actualizar/crear AdaptationDate por artículo
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
                'message'        => 'Adaptation updated successfully',
                'adaptation'     => $adaptation,
                'article_files'  => $articleAttachments,
                'general_files'  => $generalFiles, // opcional
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
            $adaptation = Adaptation::findOrFail($id);

            // Actualizar estado de las ordenes ejecutadas
            OrdenesEjecutadas::where('adaptation_id', $adaptation->id)->update([
                'estado' => '-11000',
            ]);

            // Eliminar las fechas de adaptación
            AdaptationDate::where('adaptation_id', $adaptation->id)->delete();

            // (Opcional) eliminar adjunto general asociado
            if (!empty($adaptation->attachment)) {
                Storage::disk('public')->delete($adaptation->attachment);
            }

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
