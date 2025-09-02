<?php

namespace App\Services;

use iio\libmergepdf\Merger;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use setasign\Fpdi\PdfParser\StreamReader as PdfParserStreamReader;
use setasign\Fpdi\PdfReader\StreamReader;
use setasign\Fpdi\Tcpdf\Fpdi as TcpdfFpdi;

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

    public function applyMetadata(
        string $pdfBytes,
        string $title,
        string $author = 'Logismart',
        string $subject = 'Orden de producción'
    ): string {
        $pdf = new TcpdfFpdi();

        // No queremos headers/footers automáticos
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        // Metadata que verá la pestaña del navegador
        $pdf->SetTitle($title, true);   // true = UTF-8
        $pdf->SetAuthor($author, true);
        $pdf->SetSubject($subject, true);

        // Importa todas las páginas del PDF de entrada
        $reader = PdfParserStreamReader::createByString($pdfBytes);
        $pageCount = $pdf->setSourceFile($reader);

        for ($i = 1; $i <= $pageCount; $i++) {
            $tplId = $pdf->importPage($i);
            $size  = $pdf->getTemplateSize($tplId);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tplId);
        }

        // 'S' = devuelve el resultado como string (bytes)
        return $pdf->Output('', 'S');
    }

    /**
     * (Azúcar) Fusiona y aplica metadata en un solo paso.
     */
    public function mergeWithAttachmentsAndMetadata(
        string $mainPdfBytes,
        string $numberOrder,
        string $title,
        string $author = 'Logismart',
        string $subject = 'Orden de producción'
    ): string {
        $merged = $this->mergeMainWithAttachments($mainPdfBytes, $numberOrder);
        return $this->applyMetadata($merged, $title, $author, $subject);
    }
}
