<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AuthController extends Controller
{
    /** =======================
     *         LOGIN
     *  ======================= */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['estado' => 'error', 'mensaje' => 'Correo electrónico no encontrado'], 404);
        }

        if (!$token = Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['estado' => 'error', 'mensaje' => 'Contraseña incorrecta'], 401);
        }

        return response()->json([
            'estado' => 'éxito',
            'usuario' => $user,
            'autorización' => [
                'token' => $token,
                'tipo'  => 'bearer',
            ],
        ]);
    }

    /** =======================
     *       REGISTRO SIMPLE
     *  ======================= */
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $usuario = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = Auth::login($usuario);

        return response()->json([
            'estado' => 'éxito',
            'mensaje' => 'Usuario creado con éxito',
            'usuario' => $usuario,
            'autorización' => [
                'token' => $token,
                'tipo'  => 'bearer',
            ],
        ]);
    }

    /** =======================
     *     LOGOUT & REFRESH
     *  ======================= */
    public function logout()
    {
        Auth::logout();
        return response()->json(['estado' => 'éxito', 'mensaje' => 'Cierre de sesión exitoso']);
    }

    public function refresh()
    {
        return response()->json([
            'estado' => 'éxito',
            'usuario' => Auth::user(),
            'autorización' => [
                'token' => Auth::refresh(),
                'tipo'  => 'bearer',
            ],
        ]);
    }

    /** =======================
     *       CREAR USUARIO
     *  ======================= */
    public function create(Request $request)
    {
        Log::info('Datos recibidos para crear usuario:', $request->all());

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|max:255|unique:users',
            'password'      => 'required|string|min:6',
            'role'          => 'required|string',
            'signature_bpm' => 'required|string|max:255|unique:users',
            'factory'       => 'nullable|array',
        ]);

        try {
            $usuario = User::create([
                'name'          => $request->name,
                'email'         => $request->email,
                'password'      => Hash::make($request->password),
                'role'          => $request->role,
                'signature_bpm' => $request->signature_bpm,
                'factory'       => $request->factory,
            ]);

            return response()->json([
                'estado' => 'éxito',
                'mensaje' => 'Usuario creado con éxito',
                'usuario' => $usuario,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear usuario: ' . $e->getMessage());
            return response()->json(['estado' => 'error', 'mensaje' => 'Error al crear el usuario'], 500);
        }
    }

    /** =======================
     *     ACTUALIZAR USUARIO
     *  ======================= */
    public function getUserUpdate(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            Log::warning("Intento de actualización fallido: Usuario con id {$id} no encontrado a las " . Carbon::now('America/Bogota'));
            return response()->json(['estado' => 'error', 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => "required|email|max:255|unique:users,email,$id",
            'role'          => 'required|string',
            'factory'       => 'nullable|array',
            'signature_bpm' => "required|string|max:255|unique:users,signature_bpm,$id",
            // Password es opcional, pero si se envía debe ser válida
            'password'      => 'nullable|string|min:8|confirmed',
            // Si usas confirmación: debes enviar password_confirmation desde el frontend
        ]);

        // Datos nuevos a actualizar (sin incluir la contraseña aún)
        $newData = [
            'name'          => $request->name,
            'email'         => $request->email,
            'role'          => $request->role,
            'factory'       => $request->factory,
            'signature_bpm' => $request->signature_bpm,
        ];

        // Si se envía la contraseña y no viene vacía, la hasheamos
        if ($request->filled('password')) {
            $newData['password'] = Hash::make($request->password);
        }

        // Log de los datos a actualizar antes del update (sin la contraseña)
        Log::info('Actualizando usuario', [
            'id' => $id,
            'old_data' => $user->toArray(),
            'new_data' => array_diff_key($newData, ['password' => '']), // Oculta la pass en logs
            'hora' => Carbon::now('America/Bogota')->toDateTimeString()
        ]);

        $user->update($newData);

        Log::info("Usuario actualizado exitosamente", [
            'id' => $id,
            'hora' => Carbon::now('America/Bogota')->toDateTimeString()
        ]);

        return response()->json([
            'estado' => 'éxito',
            'mensaje' => 'Usuario actualizado con éxito',
            'usuario' => $user,
        ]);
    }
    /** =======================
     *     ELIMINAR USUARIO
     *  ======================= */
    public function getUserDelete($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['estado' => 'error', 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $user->delete();
        return response()->json(['estado' => 'éxito', 'mensaje' => 'Usuario eliminado con éxito']);
    }

    /** =======================
     *       USUARIOS VARIOS
     *  ======================= */
    public function getUsers()
    {
        return response()->json(User::all());
    }

    public function getuserById($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['estado' => 'error', 'mensaje' => 'Usuario no encontrado'], 404);
        }
        return response()->json(['estado' => 'éxito', 'usuario' => $user]);
    }

    public function getUserByEmail($email)
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['estado' => 'error', 'mensaje' => 'Correo electrónico no encontrado'], 404);
        }
        return response()->json(['estado' => 'éxito', 'usuario' => $user]);
    }

    public function role()
    {
        return response()->json(Role::all());
    }

    /** =======================
     *     MANEJO DE IMAGENES
     *  ======================= */
    public function uploadUserImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,gif|max:2048',
        ]);

        $imagePath = $request->file('image')->store('images', 'public');
        $imageUrl = env('APP_URL') . '/storage/' . $imagePath;

        return response()->json([
            'estado' => 'éxito',
            'mensaje' => 'Imagen subida correctamente',
            'image_url' => $imageUrl,
            'image_path' => $imagePath,
        ]);
    }

    public function EditImage(Request $request, $email)
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['mensaje' => 'Usuario no encontrado'], 404);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,gif|max:2048',
        ]);

        if ($user->image) {
            $oldImagePath = public_path('storage/' . $user->image);
            if (file_exists($oldImagePath)) {
                unlink($oldImagePath);
            }
        }

        $imagePath = $request->file('image')->store('images', 'public');
        $user->image = $imagePath;
        $user->save();

        return response()->json([
            'mensaje' => 'Imagen actualizada correctamente',
            'image' => asset('storage/' . $imagePath),
        ]);
    }
}