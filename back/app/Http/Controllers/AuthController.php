<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Buscar el usuario por su correo
        $usuario = User::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json([
                'estado' => 'error',
                'mensaje' => 'Correo electrónico no encontrado',
            ], 404);
        }

        $credenciales = $request->only('email', 'password');

        // Intenta autenticar al usuario con las credenciales
        $token = Auth::attempt($credenciales);

        if (!$token) {
            return response()->json([
                'estado' => 'error',
                'mensaje' => 'Contraseña incorrecta',
            ], 401);
        }

        return response()->json([
            'estado' => 'éxito',
            'usuario' => $usuario,
            'autorización' => [
                'token' => $token,
                'tipo' => 'bearer',
            ]
        ]);
    }


    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $usuario = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = Auth::login($usuario);
        return response()->json([
            'estado' => 'éxito',
            'mensaje' => 'Usuario creado con éxito',
            'usuario' => $usuario,
            'autorización' => [
                'token' => $token,
                'tipo' => 'bearer',
            ]
        ]);
    }

    public function logout()
    {
        Auth::logout();
        return response()->json([
            'estado' => 'éxito',
            'mensaje' => 'Cierre de sesión exitoso',
        ]);
    }

    public function refresh()
    {
        return response()->json([
            'estado' => 'éxito',
            'usuario' => Auth::user(),
            'autorización' => [
                'token' => Auth::refresh(),
                'tipo' => 'bearer',
            ]
        ]);
    }
}
