<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ArticleService
{
    /**
     * Llama a la API remota para obtener artículos por coddiv y retorna el desart del codart exacto.
     */
    public static function getDesartByCodart(string $coddiv, string $codart): ?string
    {
        try {
            $response = Http::get("http://129.146.161.23/BackEnd_Orion/lista_articulos.php?coddiv=" . urlencode($coddiv));

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();

            if (!is_array($data)) {
                return null;
            }

            // Buscar el artículo que coincida con el codart exacto
            foreach ($data as $articulo) {
                if (isset($articulo['codart']) && $articulo['codart'] === $codart) {
                    return $articulo['desart'] ?? null;
                }
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }
}