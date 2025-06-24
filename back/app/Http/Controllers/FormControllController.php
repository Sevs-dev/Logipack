<?php

namespace App\Http\Controllers;

use App\Models\FormControl;
use Illuminate\Http\Request;

class FormControllController extends Controller
{
    public function create_function(Request $request)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'ejecutada_id' => 'required|integer',
            'stage_id' => 'required|integer',
            'activity_id' => 'required|integer',
            'description' => 'required|string|max:255',
            'types' => 'nullable|array',
            'user' => 'required|string|max:255',
        ]);

        // Create a new form control entry
        $Form = FormControl::create($validatedData);

        return response()->json([
            'message' => 'Form creado exitosamente',
            'Form' => $Form
        ], 201);
    }
}