<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
        // Log::info('Datos recibidos para crear usuario:', $request->all());

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|max:255|unique:users',
            'password'      => 'required|string|min:6',
            'role'          => 'required|string',
            'signature_bpm' => 'required|string|max:255|unique:users',
            'security_pass' => 'nullable|string|max:255|min:6',
            'factory'       => 'nullable|array',
        ]);

        try {
            $usuario = User::create([
                'name'          => $request->name,
                'email'         => $request->email,
                'password'      => Hash::make($request->password),
                'role'          => $request->role,
                'signature_bpm' => $request->signature_bpm,
                'security_pass' => $request->security_pass,
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

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => "required|email|max:255|unique:users,email,$id",
            'role'          => 'required|string',
            'factory'       => 'nullable|array',
            'signature_bpm' => "required|string|max:255|unique:users,signature_bpm,$id",
            'security_pass' => "nullable|string|max:255",   // ← sin el '|' extra
            // Password es opcional, pero si se envía debe ser válida
            'password'      => 'nullable|string|min:8|confirmed',
        ]);

        // Datos a actualizar (sin incluir security_pass todavía)
        $newData = [
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'role'          => $validated['role'],
            'factory'       => $validated['factory'] ?? null,
            'signature_bpm' => $validated['signature_bpm'],
        ];

        // Actualiza password si llegó y no está vacía
        if (!empty($validated['password'])) {
            $newData['password'] = Hash::make($validated['password']);
        }

        // ── security_pass: solo actualizar si llega, no está vacío y CAMBIÓ ──────
        if ($request->has('security_pass')) {
            $incoming = trim((string) $request->input('security_pass', ''));

            if ($incoming !== '') {
                // Soporta almacenado hasheado o en texto plano
                $sameHashed = Hash::check($incoming, (string) $user->security_pass); // coincide con hash?
                $samePlain  = hash_equals((string) $user->security_pass, $incoming); // coincide texto plano?

                if (!$sameHashed && !$samePlain) {
                    // Cambió → guarda hasheado
                    $newData['security_pass'] = Hash::make($incoming);
                }
                // Si es igual (hashed o plano), NO lo toques
            }
            // Si llega vacío (''), ignorar: no sobreescribir con vacío
        }

        $user->update($newData);

        return response()->json([
            'estado'  => 'éxito',
            'mensaje' => 'Usuario actualizado con éxito',
            'usuario' => $user->fresh(), // devuelve últimos valores
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

    /** =======================
     *     Validar Usuario y Security Pass por Rol
     *  ======================= */
    public function validateSecurityPassByRole(Request $request)
    {
        try {
            $data = $request->validate([
                'role'          => 'sometimes|required_without:role_id|string',
                'role_id'       => 'sometimes|required_without:role|integer',
                'security_pass' => 'required|string|min:1',
            ]);

            Log::info('validateSecurityPassByRole:payload', $data);

            $inputPass = $data['security_pass'];
            $query = User::query()->whereNotNull('security_pass');

            // Prioriza rol por texto (tu caso)
            if (isset($data['role'])) {
                $query->where('role', $data['role']);
            } elseif (isset($data['role_id'])) {
                if (Schema::hasColumn('users', 'role_id')) {
                    $query->where('role_id', $data['role_id']);
                } else {
                    // Traduce role_id → roles.name si no existe users.role_id
                    $roleName = DB::table('roles')->where('id', $data['role_id'])->value('name');
                    if (!$roleName) return response()->json(['valid' => false], 200);
                    $query->where('role', $roleName);
                }
            }

            // Evita 500: si no hay nadie que matchee, devuelve false
            $candidatos = $query->get(['id', 'name', 'role', 'security_pass']);
            foreach ($candidatos as $u) {
                if (Hash::check($inputPass, $u->security_pass)) {
                    return response()->json([
                        'valid' => true,
                        'user'  => ['id' => $u->id, 'name' => $u->name, 'role' => $u->role],
                    ], 200);
                }
                if (hash_equals((string)$u->security_pass, (string)$inputPass)) {
                    $u->forceFill(['security_pass' => Hash::make($inputPass)])->save();
                    return response()->json([
                        'valid' => true,
                        'user'  => ['id' => $u->id, 'name' => $u->name, 'role' => $u->role],
                        'migrated' => true,
                    ], 200);
                }
            }

            return response()->json(['valid' => false], 200);
        } catch (\Throwable $e) {
            Log::error('validateSecurityPassByRole:error', [
                'msg' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            // Nunca 500 al cliente: devuelve false y loguea
            return response()->json(['valid' => false], 200);
        }
    }
}
