<?php

namespace App\Http\Controllers;

use App\Models\Audit;
use App\Models\AdaptationAudit;
use App\Models\AdminAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryAuditController extends Controller
{
    // Obtener todo el historial
    public function index(): JsonResponse
    {
        $audits = Audit::orderByDesc('created_at')->get();
        return response()->json($audits);
    }

    public function indexAdaptation(): JsonResponse
    {
        $audits = AdaptationAudit::orderByDesc('created_at')->get();
        return response()->json($audits);
    }

    public function indexAdmin(): JsonResponse
    {
        $audits = AdminAudit::orderByDesc('created_at')->get();
        return response()->json($audits);
    }

    // Obtener historial por modelo e ID
    public function byModel(string $model, int $id): JsonResponse
    {
        $modelClass = 'App\\Models\\' . ucfirst($model);

        if (!class_exists($modelClass)) {
            return response()->json(['message' => 'Modelo no válido'], 400);
        }

        $instance = $modelClass::find($id);

        if (!$instance) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        if (!isset($instance->reference_id)) {
            return response()->json(['message' => 'El modelo no tiene referencia válida'], 400);
        }

        // Filtra solo las auditorías con acción 'create'
        $audits = Audit::where('auditable_type', $modelClass)
            ->where('reference_id', $instance->reference_id)
            ->where('action', 'create') // <-- filtro clave aquí
            ->orderBy('version', 'asc')
            ->get()
            ->map(function ($a) {
                if ((int)($a->version ?? 0) > 1) {
                    $a->action = 'update';
                }
                return $a;
            });

        return response()->json($audits);
    }

    public function byModelAdaptation(string $model, int $id): JsonResponse
    {
        $modelClass = 'App\\Models\\' . ucfirst($model);

        if (!class_exists($modelClass)) {
            return response()->json(['message' => 'Modelo no válido'], 400);
        }

        $instance = $modelClass::find($id);

        if (!$instance) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        if (!isset($instance->reference_id)) {
            return response()->json(['message' => 'El modelo no tiene referencia válida'], 400);
        }

        // Filtra solo las auditorías con acción 'create'
        $audits = AdaptationAudit::where('auditable_type', $modelClass)
            ->where('reference_id', $instance->reference_id)
            ->where('action', 'create') // <-- filtro clave aquí
            ->orderBy('version', 'asc')
            ->get()
            ->map(function ($a) {
                if ((int)($a->version ?? 0) > 1) {
                    $a->action = 'update';
                }
                return $a;
            });

        return response()->json($audits);
    }

    public function byModelAdmin(string $model, int $id): JsonResponse
    {
        $modelClass = 'App\\Models\\' . ucfirst($model);

        if (!class_exists($modelClass)) {
            return response()->json(['message' => 'Modelo no válido'], 400);
        }

        $instance = $modelClass::find($id);

        if (!$instance) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        if (!isset($instance->reference_id)) {
            return response()->json(['message' => 'El modelo no tiene referencia válida'], 400);
        }

        // Filtra solo las auditorías con acción 'create'
        $audits = AdminAudit::where('auditable_type', $modelClass)
            ->where('reference_id', $instance->reference_id)
            ->where('action', 'create') // <-- filtro clave aquí
            ->orderBy('version', 'asc')
            ->get()
            ->map(function ($a) {
                if ((int)($a->version ?? 0) > 1) {
                    $a->action = 'update';
                }
                return $a;
            });

        return response()->json($audits);
    }
}