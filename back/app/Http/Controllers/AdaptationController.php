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
    /** Sanitiza el nombre base (sin extensión) para evitar caracteres raros */
    private function sanitizeBasename(string $name): string
    {
        $name = trim($name);
        $name = preg_replace('/\s+/', '_', $name);
        return preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $name);
    }

    /** Genera un nombre único preservando el nombre original */
    private function uniqueFilenameFromUpload($file): string
    {
        $original = $file->getClientOriginalName();
        $base = pathinfo($original, PATHINFO_FILENAME);
        $ext  = $file->getClientOriginalExtension();
        $safeBase = $this->sanitizeBasename($base);
        $stamp = Carbon::now()->format('Ymd_His_u');
        return $ext ? "{$stamp}__{$safeBase}.{$ext}" : "{$stamp}__{$safeBase}";
    }

    public function newAdaptation(Request $request)
    {
        try {
            Log::info('🚀 Iniciando newAdaptation', [
                'request_all' => $request->all(),
                'files'       => array_keys($request->allFiles()),
            ]);

            $validatedData = $request->validate([
                'client_id'     => 'required|exists:clients,id',
                'article_code'  => 'required|json',
                'attachment'    => 'nullable|file|mimes:pdf|max:10240',   // único
                'attachments'   => 'nullable|array|max:20',               // múltiples
                'attachments.*' => 'file|mimes:pdf|max:10240',
                'master'        => 'nullable|exists:maestras,id',
                'bom'           => 'nullable|exists:boms,id',
                'ingredients'   => 'nullable|json',
                'number_order'  => 'required|string',
                'factory_id'    => 'required|exists:factories,id',
                'user'          => 'string|nullable',
            ]);
            Log::info('✅ Datos validados', $validatedData);

            // === Consecutivo y número de orden ===
            $now          = Carbon::now();
            $prefix       = Str::before($validatedData['number_order'], '-');
            $currentYear  = $now->year;
            $currentMonth = $now->format('m');

            $consecutive = Consecutive::firstOrNew(['prefix' => $prefix]);
            Log::info('🔢 Consecutive cargado', $consecutive->toArray());

            if ($consecutive->year != $currentYear || $consecutive->month != $currentMonth) {
                $consecutive->year = $currentYear;
                $consecutive->month = $currentMonth;
                $consecutive->consecutive = '0000000';
            } else {
                $consecutive->consecutive = str_pad((int)$consecutive->consecutive + 1, 7, '0', STR_PAD_LEFT);
            }
            $consecutive->save();
            Log::info('💾 Consecutive actualizado', $consecutive->toArray());

            $newNumberOrder = sprintf('%s-%04d-%02d-%07d', $prefix, $consecutive->year, $consecutive->month, $consecutive->consecutive);
            $validatedData['number_order'] = $newNumberOrder;
            Log::info('🆕 Nuevo número de orden generado', ['number_order' => $newNumberOrder]);

            // === Carpetas por orden ===
            $baseDir     = "attachments/{$newNumberOrder}";
            $generalDir  = "{$baseDir}/general";
            Storage::disk('public')->makeDirectory($generalDir);
            Log::info('📂 Carpetas creadas', ['baseDir' => $baseDir, 'generalDir' => $generalDir]);

            // === Adjuntos generales (múltiples + único) ===
            $generalFiles = [];
            if ($request->hasFile('attachments')) {
                foreach ((array) $request->file('attachments') as $file) {
                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }
                    $filename = $this->uniqueFilenameFromUpload($file);
                    $path     = $file->storeAs($generalDir, $filename, 'public');
                    $generalFiles[] = $path;
                }
                Log::info('📎 Adjuntos múltiples procesados', ['generalFiles' => $generalFiles]);
            }

            $mainPath = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }
                $filename = $this->uniqueFilenameFromUpload($file);
                $path     = $file->storeAs($generalDir, $filename, 'public');
                $mainPath = $path;
                Log::info('📎 Adjunto único procesado', ['mainPath' => $mainPath]);
            } elseif (!empty($generalFiles)) {
                $mainPath = $generalFiles[0];
                Log::info('ℹ️ Usando primer adjunto múltiple como principal', ['mainPath' => $mainPath]);
            }

            // === Adjuntos por artículo ===
            $articleAttachments = [];
            $allFiles = $request->allFiles();
            Log::info('📥 Archivos recibidos', ['keys' => array_keys($allFiles)]);

            foreach ($allFiles as $key => $fileOrArray) {
                if (!Str::startsWith($key, 'attachment_')) continue;

                $codart = Str::after($key, 'attachment_');
                $safeCodart = $this->sanitizeBasename($codart);
                $filesForArticle = is_array($fileOrArray) ? $fileOrArray : [$fileOrArray];

                $articleDir = "{$baseDir}/articles/{$safeCodart}";
                Storage::disk('public')->makeDirectory($articleDir);

                foreach ($filesForArticle as $fa) {
                    if ($fa instanceof SymfonyUploadedFile && !$fa instanceof LaravelUploadedFile) {
                        $fa = LaravelUploadedFile::createFromBase($fa);
                    }
                    $filename = $this->uniqueFilenameFromUpload($fa);
                    $path = $fa->storeAs($articleDir, $filename, 'public');
                    $articleAttachments[$codart][] = $path;
                }
            }
            Log::info('📎 Archivos adjuntos por artículo procesados', ['article_attachments' => $articleAttachments]);

            // === Preparar attachment JSON ===
            $attachmentPayload = [
                'main'       => $mainPath,
                'others'     => $generalFiles,
                'by_article' => $articleAttachments,
            ];
            Log::info('📦 Payload final de attachment', $attachmentPayload);

            // === Crear Adaptation ===
            $articleCodeArr = json_decode($validatedData['article_code'], true);
            $ingredientsArr = isset($validatedData['ingredients']) ? json_decode($validatedData['ingredients'], true) : [];

            // IMPORTANTE:
            // Si NO tienes $casts en el modelo, forzamos JSON aquí para evitar "Array to string conversion".
            // Si agregas en el modelo:
            //   protected $casts = ['article_code'=>'array','ingredients'=>'array','attachment'=>'array'];
            // puedes reemplazar estos json_encode por los arrays directos.
            $dataToCreate = [
                'client_id'    => (int)$validatedData['client_id'],
                'factory_id'   => (int)$validatedData['factory_id'],
                'article_code' => json_encode($articleCodeArr, JSON_UNESCAPED_SLASHES),  // ← forzado a JSON
                'number_order' => $newNumberOrder,
                'attachment'   => json_encode($attachmentPayload, JSON_UNESCAPED_SLASHES), // ← forzado a JSON
                'master'       => $validatedData['master'] ?? null,
                'bom'          => $validatedData['bom'] ?? null,
                'ingredients'  => json_encode($ingredientsArr, JSON_UNESCAPED_SLASHES),  // ← forzado a JSON
                'version'      => '1',
                'reference_id' => (string) Str::uuid(),
                'user'         => $validatedData['user'] ?? null,
            ];
            Log::info('📝 Datos a crear en Adaptation (serializados)', $dataToCreate);

            $adaptation = Adaptation::create($dataToCreate);
            Log::info('✅ Adaptation creada', ['id' => $adaptation->id]);

            // === Duración por etapas (opcional)
            $masterDuration = null;
            $duration_breakdown = [];
            if (!empty($validatedData['master'])) {
                $master = Maestra::find($validatedData['master']);
                $ingredients = $ingredientsArr ?? [];

                if ($master && is_array($master->type_stage)) {
                    $totalDuration = 0;
                    $teoricaTotal = 0;
                    foreach ($ingredients as $ing) {
                        if (isset($ing['teorica'])) $teoricaTotal += floatval($ing['teorica']);
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
                    $duration_breakdown[] = ['fase' => 'TOTAL', 'resultado' => $totalDuration];
                    $masterDuration = $totalDuration;
                }
            }

            // === Crear AdaptationDate por artículo ===
            $articleCodes = $articleCodeArr;
            $factory = Factory::find($validatedData['factory_id']);
            if (!$factory) return response()->json(['error' => 'Fábrica no encontrada'], 404);
            $factoryName = $factory->name;

            foreach ($articleCodes as $article) {
                AdaptationDate::create([
                    'client_id'           => (int)$validatedData['client_id'],
                    'factory_id'          => (int)$validatedData['factory_id'],
                    'codart'              => $article['codart'],
                    'number_order'        => $newNumberOrder,
                    'orderNumber'         => $article['orderNumber'],
                    'deliveryDate'        => $article['deliveryDate'],
                    'quantityToProduce'   => $article['quantityToProduce'],
                    'lot'                 => $article['lot'],
                    'healthRegistration'  => $article['healthRegistration'],
                    'master'              => $validatedData['master'] ?? null,
                    'bom'                 => $validatedData['bom'] ?? null,
                    'ingredients'         => json_encode($ingredientsArr, JSON_UNESCAPED_SLASHES), // según tu tabla
                    'adaptation_id'       => $adaptation->id,
                    'duration'            => $masterDuration,
                    'factory'             => $factoryName,
                    'duration_breakdown'  => json_encode($duration_breakdown, JSON_UNESCAPED_SLASHES),
                    'user'                => $validatedData['user'] ?? null,
                ]);
            }

            // === Consecutive_date ===
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
                'general_files' => $generalFiles,
                'folders'       => [
                    'base'     => $baseDir,
                    'general'  => $generalDir,
                ],
            ], 201);
        } catch (ValidationException $e) {
            Log::warning('❌ Fallo de validación', ['errors' => $e->errors()]);
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('🔥 Error inesperado al guardar la adaptación', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Error saving adaptation', 'details' => $e->getMessage()], 500);
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
            return response()->json(['adaptation' => $adaptation], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Adaptation not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error retrieving adaptation', 'details' => $e->getMessage()], 500);
        }
    }

    public function updateAdaptation(Request $request, $id)
    {
        try {
            $adaptation = Adaptation::findOrFail($id);

            $validatedData = $request->validate([
                'client_id'    => 'required|exists:clients,id',
                'factory_id'   => 'required|exists:factories,id',
                'article_code' => 'required|string',
                'number_order' => 'required|string',
                'attachment'   => 'nullable|file',
                'attachment'   => 'nullable|file|mimetypes:application/pdf',
                'attachments'  => 'nullable',
                'master'       => 'nullable|exists:maestras,id',
                'bom'          => 'nullable|exists:boms,id',
                'ingredients'  => 'nullable|string',
            ]);

            $validatedData['article_code'] = json_decode($validatedData['article_code'], true);
            $validatedData['ingredients'] = isset($validatedData['ingredients']) ? json_decode($validatedData['ingredients'], true) : null;

            // === Carpetas (usar number_order recibido / existente) ===
            $numberOrder = $validatedData['number_order'] ?? $adaptation->number_order;
            $baseDir     = "attachments/{$numberOrder}";
            $generalDir  = "{$baseDir}/general";
            Storage::disk('public')->makeDirectory($generalDir);

            // === Adjuntos por artículo ===
            $articleAttachments = [];
            foreach ($request->allFiles() as $key => $fileOrArray) {
                if (!Str::startsWith($key, 'attachment_')) continue;

                $codart     = Str::after($key, 'attachment_');
                $safeCodart = $this->sanitizeBasename($codart);
                $files      = is_array($fileOrArray) ? $fileOrArray : [$fileOrArray];

                $articleDir = "{$baseDir}/articles/{$safeCodart}";
                Storage::disk('public')->makeDirectory($articleDir);

                foreach ($files as $fa) {
                    if ($fa instanceof SymfonyUploadedFile && !$fa instanceof LaravelUploadedFile) {
                        $fa = LaravelUploadedFile::createFromBase($fa);
                    }
                    // (opcional) valida mimetype aquí si no lo hiciste arriba
                    // if ($fa->getMimeType() !== 'application/pdf') { continue; }

                    $filename = $this->uniqueFilenameFromUpload($fa);
                    $path     = $fa->storeAs($articleDir, $filename, 'public');
                    $articleAttachments[$codart][] = $path;
                }
            }
            Log::info("📎 Adjuntos por artículo", ['article_attachments' => $articleAttachments]);

            // === Adjuntos generales: soporta `attachments[]` (varios) y `attachments` (uno)
            $generalFiles = [];
            if ($request->hasFile('attachments')) {
                $files = $request->file('attachments');
                $files = is_array($files) ? $files : [$files]; // si mandan uno sin []
                foreach ($files as $file) {
                    if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                        $file = LaravelUploadedFile::createFromBase($file);
                    }
                    $filename = $this->uniqueFilenameFromUpload($file);
                    $path     = $file->storeAs($generalDir, $filename, 'public');
                    $generalFiles[] = $path;
                }
            }

            // === Adjunto general único: `attachment`
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                if ($file instanceof SymfonyUploadedFile && !$file instanceof LaravelUploadedFile) {
                    $file = LaravelUploadedFile::createFromBase($file);
                }
                // elimina el anterior si existía
                if (!empty($adaptation->attachment)) {
                    Storage::disk('public')->delete($adaptation->attachment);
                }
                $filename = $this->uniqueFilenameFromUpload($file);
                $filePath = $file->storeAs($generalDir, $filename, 'public');
                $validatedData['attachment'] = $filePath;
            } elseif (!empty($generalFiles)) {
                // si subieron varios en 'attachments', toma el primero como "principal"
                $validatedData['attachment'] = $generalFiles[0];
            } else {
                $validatedData['attachment'] = $adaptation->attachment;
            }

            // === Duración ===
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
                    $duration_breakdown[] = ['fase' => 'TOTAL', 'resultado' => $totalDuration];
                    $masterDuration = $totalDuration;
                }
            }

            // === Actualizar Adaptation ===
            $adaptation->update([
                'client_id'    => $validatedData['client_id'],
                'factory_id'   => $validatedData['factory_id'],
                'article_code' => json_encode($validatedData['article_code']),
                'number_order' => $numberOrder,
                'attachment'   => $validatedData['attachment'],
                'master'       => $validatedData['master'],
                'bom'          => $validatedData['bom'],
                'ingredients'  => json_encode($validatedData['ingredients']),
            ]);

            // === Upsert AdaptationDate ===
            foreach ($validatedData['article_code'] as $article) {
                AdaptationDate::updateOrCreate(
                    ['adaptation_id' => $adaptation->id, 'codart' => $article['codart']],
                    [
                        'client_id'           => $validatedData['client_id'],
                        'factory_id'          => $validatedData['factory_id'],
                        'number_order'        => $numberOrder,
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
                'general_files'  => $generalFiles,
                'folders'        => [
                    'base'     => $baseDir,
                    'general'  => $generalDir,
                ],
            ], 200);
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::warning("🔥 Error inesperado en updateAdaptation: " . $e->getMessage());
            return response()->json(['error' => 'Error updating adaptation', 'details' => $e->getMessage()], 500);
        }
    }

    public function deleteAdaptation($id)
    {
        try {
            $adaptation = Adaptation::findOrFail($id);

            OrdenesEjecutadas::where('adaptation_id', $adaptation->id)->update(['estado' => '-11000']);
            AdaptationDate::where('adaptation_id', $adaptation->id)->delete();

            // Elimina solo el archivo "attachment" referenciado
            if (!empty($adaptation->attachment)) {
                Storage::disk('public')->delete($adaptation->attachment);
            }

            // (Opcional) si quisieras borrar TODA la carpeta del número de orden:
            // $folder = 'attachments/' . $adaptation->number_order;
            // Storage::disk('public')->deleteDirectory($folder);

            $adaptation->delete();

            return response()->json(['message' => 'Adaptation and related dates deleted successfully'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Adaptation not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error deleting adaptation', 'details' => $e->getMessage()], 500);
        }
    }

    public function debugBomAndIngredients($id)
    {
        $adaptation = Adaptation::find($id);
        if (!$adaptation) {
            return response()->json(['error' => 'Adaptation not found', 'adaptation_id' => $id], 404);
        }

        $bom = is_string($adaptation->bom) ? json_decode($adaptation->bom, true) : $adaptation->bom;
        $ingredients = is_string($adaptation->ingredients) ? json_decode($adaptation->ingredients, true) : $adaptation->ingredients;

        return response()->json([
            'adaptation_id' => $adaptation->id,
            'bom'           => $bom ?? 'No válido o vacío',
            'ingredients'   => $ingredients ?? 'No válido o vacío',
        ]);
    }
}
