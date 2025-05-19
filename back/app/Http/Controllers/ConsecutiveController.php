<?php

namespace App\Http\Controllers;

use App\Models\Consecutive;
use Illuminate\Http\JsonResponse; 
use App\Models\Consecutive_date;

class ConsecutiveController extends Controller
{
    /**
     * Obtener todos los consecutivos.
     */
    public function getAll(): JsonResponse
    {
        $consecutives = Consecutive::all();

        return response()->json([
            'consecutives' => $consecutives
        ]);
    }
    
    public function getAllConsecutiveDates(): JsonResponse
    {
        $consecutives = Consecutive_date::all();

        return response()->json([
            'consecutives' => $consecutives
        ]);
    }

    public function getPrefix(string $prefix): JsonResponse
{
    $consecutives = Consecutive::where('prefix', 'like', $prefix . '%')->get();

    return response()->json([
        'consecutives' => $consecutives
    ]);
}
}