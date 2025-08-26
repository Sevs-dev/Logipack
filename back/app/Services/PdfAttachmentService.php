<?php

namespace App\Services;

use iio\libmergepdf\Merger;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfAttachmentService
{
    /**
     * Retorna rutas ABSOLUTAS (en el FS) de todos los .pdf bajo attachments/{numberOrder}
     * Orden: primero /general/, luego /articles/ (alfabético).
     */
    public function collectOrderPdfPaths(string $numberOrder): array
    {
        $baseDir = "attachments/{$numberOrder}";
        $all = Storage::disk('public')->allFiles($baseDir);

        $pdfs = collect($all)
            ->filter(fn($p) => Str::endsWith(Str::lower($p), '.pdf'))
            ->map(fn($p) => Storage::disk('public')->path($p)) // ABS normalizado
            ->values()
            ->all();

        // general/ primero
        usort($pdfs, function ($a, $b) {
            $ra = str_contains($a, DIRECTORY_SEPARATOR . 'general' . DIRECTORY_SEPARATOR) ? 0 : 1;
            $rb = str_contains($b, DIRECTORY_SEPARATOR . 'general' . DIRECTORY_SEPARATOR) ? 0 : 1;
            return $ra <=> $rb ?: strcmp($a, $b);
        });

        return $pdfs;
    }

    /**
     * Fusiona el PDF principal (bytes) con todos los anexos de la orden.
     * Usa addRaw() para evitar problemas de rutas en Windows si hace falta.
     */
    public function mergeMainWithAttachments(string $mainPdfBytes, string $numberOrder): string
    {
        // Asegurar tmp
        Storage::disk('local')->makeDirectory('tmp');
        $tmpName = 'tmp/' . Str::uuid() . '.pdf';
        Storage::disk('local')->put($tmpName, $mainPdfBytes);

        // Ruta ABS normalizada en cualquier SO
        $mainPdfAbs = Storage::disk('local')->path($tmpName);

        // Sanity check
        $mainOk = is_file($mainPdfAbs) && filesize($mainPdfAbs) > 100;

        // Recolectar anexos PDF
        $attached = $this->collectOrderPdfPaths($numberOrder);
        $attached = array_values(array_filter($attached, fn($p) => is_file($p) && is_readable($p)));

        try {
            $merger = new Merger();

            // Principal: si el path está ok, addFile; si no, addRaw
            if ($mainOk) {
                $merger->addFile($mainPdfAbs);
            } else {
                $merger->addRaw($mainPdfBytes);
            }

            // Anexos: raw para blindarnos contra rutas Frankenstein en Windows
            foreach ($attached as $abs) {
                $bytes = @file_get_contents($abs);
                if ($bytes !== false && strlen($bytes) > 100) {
                    $merger->addRaw($bytes);
                }
            }

            return $merger->merge();
        } finally {
            Storage::disk('local')->delete($tmpName);
        }
    }
}
