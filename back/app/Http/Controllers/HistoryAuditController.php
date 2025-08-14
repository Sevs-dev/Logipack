<?php

namespace App\Http\Controllers;

use App\Models\Audit;
use App\Models\AdaptationAudit;
use App\Models\AdminAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class HistoryAuditController extends Controller
{
    /** Resuelve el FQCN del modelo desde el parámetro {model}. */
    private function resolveModelClass(string $model): ?string
    {
        // Normaliza: "roles" -> "Role", "user_roles" -> "UserRole", etc.
        $studly = Str::studly(Str::singular($model));
        $fqcn = "App\\Models\\{$studly}";

        // Mapa de alias opcional (por si tienes nombres raros)
        $aliases = [
            'Roles' => 'App\\Models\\Role',
            'roles' => 'App\\Models\\Role',
            'role'  => 'App\\Models\\Role',
            // agrega más si lo necesitas...
        ];

        if (isset($aliases[$model])) return $aliases[$model];
        if (class_exists($fqcn)) return $fqcn;

        return null;
    }

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

    public function byModel(string $model, int $id): JsonResponse
    {
        $modelClass = $this->resolveModelClass($model);
        if (!$modelClass) {
            return response()->json(['message' => 'Modelo no válido'], 400);
        }

        $instance = $modelClass::find($id);
        if (!$instance) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        if (!isset($instance->reference_id) || !$instance->reference_id) {
            return response()->json(['message' => 'El modelo no tiene referencia válida'], 400);
        }

        $audits = Audit::where('auditable_type', $modelClass)
            ->where('reference_id', $instance->reference_id)
            ->where('action', 'create')
            ->orderBy('version', 'asc') // si version es string, usa orderByRaw('CAST(version AS UNSIGNED) asc')
            ->get()
            ->map(function ($a) {
                if ((int)($a->version ?? 0) > 1) $a->action = 'update';
                return $a;
            });

        return response()->json($audits);
    }

    public function byModelAdaptation(string $model, int $id): JsonResponse
    {
        $modelClass = $this->resolveModelClass($model);
        if (!$modelClass) {
            return response()->json(['message' => 'Modelo no válido'], 400);
        }

        $instance = $modelClass::find($id);
        if (!$instance) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        if (!isset($instance->reference_id) || !$instance->reference_id) {
            return response()->json(['message' => 'El modelo no tiene referencia válida'], 400);
        }

        $audits = AdaptationAudit::where('auditable_type', $modelClass)
            ->where('reference_id', $instance->reference_id)
            ->where('action', 'create')
            ->orderBy('version', 'asc')
            ->get()
            ->map(function ($a) {
                if ((int)($a->version ?? 0) > 1) $a->action = 'update';
                return $a;
            });

        return response()->json($audits);
    }

    public function byModelAdmin(string $model, int $id): JsonResponse
    {
        $modelClass = $this->resolveModelClass($model);
        if (!$modelClass) {
            return response()->json(['message' => 'Modelo no válido'], 400);
        }

        $instance = $modelClass::find($id);
        if (!$instance) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        if (!isset($instance->reference_id) || !$instance->reference_id) {
            return response()->json(['message' => 'El modelo no tiene referencia válida'], 400);
        }

        $audits = AdminAudit::where('auditable_type', $modelClass)
            ->where('reference_id', $instance->reference_id)
            ->where('action', 'create')
            ->orderBy('version', 'asc')
            ->get()
            ->map(function ($a) {
                if ((int)($a->version ?? 0) > 1) $a->action = 'update';
                return $a;
            });

        return response()->json($audits);
    }
}