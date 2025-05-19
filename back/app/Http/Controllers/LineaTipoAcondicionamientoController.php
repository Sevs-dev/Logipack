<?php

namespace App\Http\Controllers;

use App\Models\LineaTipoAcondicionamiento;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\TipoAcondicionamiento;
use App\Models\Stage;

class LineaTipoAcondicionamientoController extends Controller
{
    public function getAll(): JsonResponse
    {
        $data = DB::table('linea_tipo_acondicionamientos as lta')
            ->leftJoin('tipo_acondicionamientos as ta', 'ta.id', '=', 'lta.tipo_acondicionamiento_id')
            ->select(
                'lta.id',
                'lta.tipo_acondicionamiento_id',
                'ta.descripcion as descripcion_tipo',
                'lta.orden',
                'lta.descripcion',
                'lta.fase',
                'lta.editable',
                'lta.control',
                'lta.fase_control',
                'lta.created_at',
                'lta.updated_at'
            )
            ->get();

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'tipo_acondicionamiento_id' => 'required|exists:tipo_acondicionamientos,id',
            'orden' => 'required|integer',
            'descripcion' => 'required|string',
            'fase' => 'required|string',
            'editable' => 'boolean',
            'control' => 'boolean',
            'fase_control' => 'nullable|string'
        ]);

        $lineaTipo = LineaTipoAcondicionamiento::create([
            'tipo_acondicionamiento_id' => $request->tipo_acondicionamiento_id,
            'orden' => $request->orden,
            'descripcion' => $request->descripcion,
            'fase' => $request->fase,
            'editable' => $request->editable ?? false,
            'control' => $request->control ?? false,
            'fase_control' => $request->fase_control
        ]);

        return response()->json([
            'message' => 'Línea de tipo de acondicionamiento creada exitosamente',
            'lineaTipo' => $lineaTipo
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $lineaTipo = LineaTipoAcondicionamiento::find($id);
        
        if (!$lineaTipo) {
            return response()->json([
                'message' => 'Línea de tipo de acondicionamiento no encontrada'
            ], 404);
        }

        return response()->json($lineaTipo);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $lineaTipo = LineaTipoAcondicionamiento::find($id);
        
        if (!$lineaTipo) {
            return response()->json([
                'message' => 'Línea de tipo de acondicionamiento no encontrada'
            ], 404);
        }

        $request->validate([
            'tipo_acondicionamiento_id' => 'exists:tipo_acondicionamientos,id',
            'orden' => 'integer',
            'descripcion' => 'string',
            'fase' => 'string',
            'editable' => 'boolean',
            'control' => 'boolean',
            'fase_control' => 'nullable|string'
        ]);

        $lineaTipo->update($request->all());

        return response()->json([
            'message' => 'Línea de tipo de acondicionamiento actualizada exitosamente',
            'lineaTipo' => $lineaTipo
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $lineaTipo = LineaTipoAcondicionamiento::find($id);
        
        if (!$lineaTipo) {
            return response()->json([
                'message' => 'Línea de tipo de acondicionamiento no encontrada'
            ], 404);
        }

        $lineaTipo->delete();

        return response()->json([
            'message' => 'Línea de tipo de acondicionamiento eliminada exitosamente'
        ]);
    }

    public function getByTipoAcondicionamiento($tipoAcondicionamientoId): JsonResponse
    {
        $lineas = DB::table('linea_tipo_acondicionamientos as lta')
            ->where('lta.tipo_acondicionamiento_id', $tipoAcondicionamientoId)
            ->select(
                'lta.id',
                'lta.tipo_acondicionamiento_id',
                'lta.orden',
                'lta.descripcion',
                'lta.fase',
                'lta.editable',
                'lta.control',
                'lta.fase_control',
                'lta.created_at',
                'lta.updated_at'
            )
            ->orderBy('lta.orden', 'asc')
            ->get();

        return response()->json($lineas);
    }

    // funcion que obtenga las dos listas tipo de acondicionamiento y linea tipo de acondicionamiento
    public function getListTipoyLineas($id): JsonResponse
    {
        $tipos = TipoAcondicionamiento::find($id);
        $lineas = LineaTipoAcondicionamiento::where('tipo_acondicionamiento_id', $id)->get();
        return response()->json([
            'tipos' => $tipos,
            'lineas' => $lineas
        ]);
    }


    public function getSelectStages(): JsonResponse
    {
        $fases = Stage::all();  
        $controles = Stage::where('phase_type', 'Control')->get();
        
        return response()->json([
            'fases' => $fases,
            'controles' => $controles
        ]);
    }
} 