"use client";

import { useState, useEffect } from "react";
import { parseCookies } from "nookies";
import { FiEye, FiEyeOff, FiUser, FiRefreshCcw } from "react-icons/fi";
import { motion } from "framer-motion";
import {
  getUsers,
  updateUser,
  getRole,
} from "../../services/userDash/authservices";
import { getFactory } from "../../services/userDash/factoryServices";
import { InfoPopover } from "../buttons/InfoPopover";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { showError, showSuccess } from "../toastr/Toaster";
import SelectorDual from "../SelectorDual/SelectorDual";
import { Factory, Role } from "@/app/interfaces/CreateUser";
import { User } from "@/app/interfaces/Auth";

const generarPasswordSegura = () => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const length = 12;
  return Array.from(
    { length },
    () => charset[Math.floor(Math.random() * charset.length)]
  ).join("");
};

export default function PerfilUsuario() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [signature_bpm, setSignatureBPM] = useState("");
  const [selectedFactorys, setSelectedFactorys] = useState<Factory[]>([]);
  const [factory, setFactory] = useState<Factory[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const modoSoloLectura = true;

  useEffect(() => {
    async function fetchData() {
      try {
        const cookies = parseCookies();
        const emailCookie = decodeURIComponent(cookies["email"] || "");
        if (!emailCookie) return showError("Correo no encontrado en cookies");

        const [allUsers, allFactories, allRoles] = await Promise.all([
          getUsers(),
          getFactory(),
          getRole(),
        ]);

        setFactory(allFactories);
        setRoles(allRoles);

        const currentUser = allUsers.find(
          (u) => decodeURIComponent(u.email) === emailCookie
        );
        if (!currentUser) return showError("Usuario no encontrado");

        const factoryParsed: Factory[] = Array.isArray(currentUser.factory)
          ? currentUser.factory
          : typeof currentUser.factory === "string"
          ? JSON.parse(currentUser.factory)
              .map((id: number) =>
                allFactories.find((f: Factory) => f.id === id)
              )
              .filter(Boolean)
          : [];

        setUser(currentUser);
        setName(currentUser.name);
        setEmail(currentUser.email);
        setRole(currentUser.role);
        setSignatureBPM(
          typeof currentUser.signature_bpm === "string"
            ? currentUser.signature_bpm
            : ""
        );
        setSelectedFactorys(factoryParsed);
      } catch (error) {
        console.error(error);
        showError("Error cargando perfil de usuario");
      }
    }
    fetchData();
  }, []);

  const validateFields = () => {
    if (!name || !email || !role) {
      showError("Nombre, correo y rol son obligatorios");
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError("El correo electrónico no es válido");
      return false;
    }
    if (
      password &&
      !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,}$/.test(
        password
      )
    ) {
      showError("Contraseña insegura o inválida");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user || !validateFields()) return;
    setLoading(true);
    try {
      await updateUser(user.id, {
        name,
        email,
        password: password || undefined,
        role,
        signature_bpm,
        factory: selectedFactorys,
      });
      showSuccess("Perfil actualizado correctamente");
    } catch (err) {
      console.error(err);
      showError("Error actualizando el perfil");
    } finally {
      setLoading(false);
    }
  };

  const agregarMaquina = (f: Factory) => {
    if (!selectedFactorys.find((m) => m.id === f.id)) {
      setSelectedFactorys([...selectedFactorys, f]);
    }
  };

  const removerMaquina = (id: number) => {
    setSelectedFactorys(selectedFactorys.filter((m) => m.id !== id));
  };

  return (
    <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className={[
    "w-full mt-10 px-6 md:px-10 py-10 rounded-3xl transition-all duration-300 shadow-xl border",
    // 🎨 Glass + gradiente basado en tokens
    "bg-gradient-to-br from-[rgb(var(--surface))]/90 via-[rgb(var(--surface-muted))]/70 to-[rgb(var(--surface))]/60",
    "backdrop-blur-xl backdrop-saturate-150",
    "border-[rgb(var(--border))]/50",
    // 🔦 Soporte dark como fallback
    "dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]",
    "dark:from-slate-900/90 dark:via-slate-800/70 dark:to-slate-900/60 dark:border-slate-700",
  ].join(" ")}
>
  <div className="flex items-center gap-4 mb-10">
    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[rgb(var(--accent))] to-pink-400 flex items-center justify-center shadow-lg text-white text-xl">
      <FiUser size={28} />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))]">Perfil de Usuario</h2>
      <p className="text-sm text-[rgb(var(--foreground))]/70">Ajusta tu información personal</p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-8">
    {/* Nombre */}
    <div>
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">Nombre</Text>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre completo"
        className={[
          "w-full p-3 text-center rounded-xl shadow-sm",
          "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground))]/50",
          "border border-[rgb(var(--border))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-transparent",
          "transition-all duration-200",
          "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
        ].join(" ")}
      />
    </div>

    {/* Email (disabled) */}
    <div>
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">Correo Electrónico</Text>
      <input
        type="email"
        value={email}
        disabled
        className={[
          "w-full p-3 text-center rounded-xl",
          "bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/80",
          "border border-[rgb(var(--border))]",
          "cursor-not-allowed opacity-90",
          "dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700",
        ].join(" ")}
      />
    </div>

    {/* Password + acciones */}
    <div className="relative">
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">
        Contraseña <span className="text-[rgb(var(--foreground))]/60">(opcional)</span>
        <InfoPopover content="Si no ingresas una nueva, se mantendrá la actual." />
      </Text>
      <div className="flex gap-2 mt-1">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva contraseña"
          className={[
            "w-full p-3 pr-10 text-center rounded-xl",
            "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground))]/50",
            "border border-[rgb(var(--border))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-transparent",
            "transition-all duration-200",
            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          className={[
            "p-2 rounded-lg border transition-all",
            "border-[rgb(var(--border))] text-[rgb(var(--foreground))] bg-[rgb(var(--surface))]",
            "hover:bg-[rgb(var(--surface-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
          ].join(" ")}
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
        <button
          type="button"
          title="Generar contraseña"
          onClick={() => setPassword(generarPasswordSegura())}
          className={[
            "p-2 rounded-lg border transition-all",
            "border-[rgb(var(--border))] text-[rgb(var(--accent))] bg-[rgb(var(--surface))]",
            "hover:bg-[rgb(var(--accent))]/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
          ].join(" ")}
        >
          <FiRefreshCcw />
        </button>
      </div>

      {/* Medidor simple de fuerza (por longitud) */}
      <div className="mt-2 h-1.5 rounded bg-[rgb(var(--border))]/50">
        <div
          className={[
            "h-full rounded transition-all",
            (password?.length || 0) < 6
              ? "bg-red-500"
              : (password?.length || 0) < 10
              ? "bg-yellow-500"
              : "bg-green-500",
          ].join(" ")}
          style={{ width: `${Math.min(100, (password?.length || 0) * 8)}%` }}
        />
      </div>
    </div>

    {/* Rol (disabled) */}
    <div className="mt-3">
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">Rol</Text>
      <select
        value={role}
        disabled
        onChange={(e) => setRole(e.target.value)}
        className={[
          "w-full p-3 text-center rounded-xl",
          "bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/80",
          "border border-[rgb(var(--border))] cursor-not-allowed opacity-90",
          "dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700",
        ].join(" ")}
      >
        <option value="">Selecciona un rol</option>
        {roles.map((r) => (
          <option key={r.id} value={r.name} className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]">
            {r.name}
          </option>
        ))}
      </select>
    </div>

    {/* Firma BPM */}
    <div>
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">Firma BPM</Text>
      <input
        type="text"
        value={signature_bpm}
        onChange={(e) => setSignatureBPM(e.target.value)}
        placeholder="Firma BPM (opcional)"
        className={[
          "w-full p-3 text-center rounded-xl",
          "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground))]/50",
          "border border-[rgb(var(--border))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-transparent",
          "transition-all duration-200",
          "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
        ].join(" ")}
      />
    </div>

    {/* Fábricas asignadas */}
    <div className="col-span-1 md:col-span-2">
      <SelectorDual
        titulo="Fábricas asignadas"
        disponibles={factory}
        seleccionados={selectedFactorys}
        onAgregar={agregarMaquina}
        onQuitar={removerMaquina}
        disabled={modoSoloLectura}
      />
    </div>
  </div>

  <hr className="my-10 border-t border-[rgb(var(--border))]/60 dark:border-slate-700" />

  <div className="flex justify-center">
    <Button
      onClick={handleSave}
      variant="save"
      label={loading ? "Guardando..." : "Guardar cambios"}
    />
  </div>
</motion.div>

  );
}
