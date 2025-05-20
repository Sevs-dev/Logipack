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
            $now = Carbon::now();
            $prefix = Str::before($validatedData['number_order'], '-');
            $currentYear = $now->year;
            $currentMonth = $now->format('m');
            $consecutive = Consecutive::firstOrNew(['prefix' => $prefix]);
            if ($consecutive->year != $currentYear || $consecutive->month != $currentMonth) {
                $consecutive->year = $currentYear;
                $consecutive->month = $currentMonth;
                $consecutive->consecutive = '0000000';
            } else {
                $consecutive->consecutive = str_pad((int)$consecutive->consecutive + 1, 7, '0', STR_PAD_LEFT); // 🟢 Incremento con ceros
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
            $articleAttachments = [];
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = 'general_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('attachments', $filename, 'public');
                $articleAttachments['general'] = $path;
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
                }
            }
            if (!empty($articleAttachments)) {
                $validatedData['attachment'] = json_encode($articleAttachments);
            }
            $adaptation = Adaptation::create($validatedData);
            $masterDuration = null;
            $duration_breakdown = [];

            if (!empty($validatedData['master'])) {
                $master = Maestra::find($validatedData['master']);
                $ingredients = json_decode($validatedData['ingredients'], true) ?? [];

                if ($master && is_array($master->type_stage)) {
                    $totalDuration = 0;

                    // Calcular total teorica solo 1 vez para los multi
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

                    // Agregar total al final del desglose
                    $duration_breakdown[] = [
                        'fase'      => 'TOTAL',
                        'resultado' => $totalDuration,
                    ];

                    $masterDuration = $totalDuration;
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

            return response()->json([
                'message'       => 'Adaptation saved successfully',
                'number_order'  => $newNumberOrder,
                'adaptation'    => $adaptation,
                'article_files' => $articleAttachments,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
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
                'master'       => 'nullable|json',
                'bom'          => 'nullable|json',
                'ingredients'  => 'nullable|json',
            ]);

            // 🗂 Procesar adjuntos individuales
            $articleAttachments = [];
            $oldAttachments = json_decode($adaptation->attachment, true) ?? [];

            foreach ($request->files as $key => $file) {
                if (Str::startsWith($key, 'attachment_')) {
                    $codart = Str::after($key, 'attachment_');
                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }

                    if (isset($oldAttachments[$codart])) {
                        Storage::disk('public')->delete($oldAttachments[$codart]);
                    }

                    $filename = $codart . '_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('attachments', $filename, 'public');
                    $articleAttachments[$codart] = $path;
                }
            }

            // 📎 Procesar adjunto general
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }

                if (is_string($adaptation->attachment)) {
                    Storage::disk('public')->delete($adaptation->attachment);
                }

                $filename = 'plano_' . now()->format('Ymd_His') . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('attachments', $filename, 'public');
                $validatedData['attachment'] = $filePath;
            }

            if (!empty($articleAttachments)) {
                $validatedData['attachment'] = json_encode($articleAttachments);
            }

            // 📦 Decodificar campos JSON
            $validatedData['master'] = isset($validatedData['master']) ? json_decode($validatedData['master'], true) : null;
            $validatedData['bom'] = isset($validatedData['bom']) ? json_decode($validatedData['bom'], true) : null;
            $validatedData['ingredients'] = isset($validatedData['ingredients']) ? json_decode($validatedData['ingredients'], true) : null;

            // ⏱ Calcular duración total y desglose
            $masterDuration = null;
            $duration_breakdown = [];

            $masterId = is_array($validatedData['master']) ? $validatedData['master']['id'] ?? null : $validatedData['master'];
            $master = $masterId ? Maestra::find($masterId) : null;

            if ($master && is_array($master->type_stage)) {
                $totalDuration = 0;

                // Calcular teorica total una sola vez
                $teoricaTotal = 0;
                foreach ($validatedData['ingredients'] ?? [] as $ing) {
                    if (isset($ing['teorica'])) {
                        $teoricaTotal += floatval($ing['teorica']);
                    }
                }

                foreach ($master->type_stage as $stageId) {
                    $stage = Stage::find($stageId);
                    if (!$stage) continue;

                    $duracionEtapa = 0;
                    $duracion_base = floatval($stage->duration);
                    $esMulti = boolval($stage->multi);
                    $multiplicacion = null;

                    if ($esMulti) {
                        $duracionEtapa = $duracion_base * $teoricaTotal;
                        $multiplicacion = "{$duracion_base} * {$teoricaTotal}";
                    } else {
                        $duracionEtapa = $duracion_base;
                    }

                    $totalDuration += $duracionEtapa;

                    $duration_breakdown[] = [
                        'fase'           => $stage->description,
                        'multi'          => $esMulti,
                        'duracion_base'  => $duracion_base,
                        'teorica_total'  => $esMulti ? $teoricaTotal : null,
                        'multiplicacion' => $multiplicacion,
                        'resultado'      => $duracionEtapa
                    ];
                }

                // Agregar total final al desglose
                $duration_breakdown[] = [
                    'fase'      => 'TOTAL',
                    'resultado' => $totalDuration
                ];

                $masterDuration = floatval($totalDuration);
            }

            // Guardar desglose y duración total en validatedData para guardar en DB
            $validatedData['duration_breakdown'] = json_encode($duration_breakdown);
            $validatedData['duration'] = $masterDuration;

            // 🧠 Log de duración calculada
            Log::info('Duración total calculada:', ['duration' => $masterDuration]);

            // 🔄 Actualizar adaptación principal
            $adaptation->update($validatedData);

            // 🧩 Actualizar fechas por artículo
            $articleCodes = json_decode($validatedData['article_code'], true);
            foreach ($articleCodes as $article) {
                $updateData = [
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
                    'duration_breakdown' => json_encode($duration_breakdown),
                ];

                Log::info('Actualizando AdaptationDate:', [
                    'adaptation_id' => $adaptation->id,
                    'codart'        => $article['codart'],
                    'data'          => $updateData,
                ]);

                AdaptationDate::updateOrCreate(
                    [
                        'adaptation_id' => $adaptation->id,
                        'codart'        => $article['codart'],
                    ],
                    $updateData
                );
            }

            return response()->json([
                'message'    => 'Adaptation updated successfully',
                'adaptation' => $adaptation
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Adaptation not found'], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error updating adaptation',
                'details' => $e->getMessage()
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