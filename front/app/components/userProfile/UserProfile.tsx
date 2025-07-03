"use client";

import { useState, useEffect } from "react";
import { parseCookies } from "nookies";
import { FiEye, FiEyeOff, FiUser, FiRefreshCcw } from "react-icons/fi";
import { motion } from "framer-motion";
import { getUsers, updateUser, getRole } from "../../services/userDash/authservices";
import { getFactory } from "../../services/userDash/factoryServices";
import { InfoPopover } from "../buttons/InfoPopover";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { showError, showSuccess } from "../toastr/Toaster";
import SelectorDual from "../SelectorDual/SelectorDual";
import { Factory, Role } from "@/app/interfaces/CreateUser";
import { User } from "@/app/interfaces/Auth";

const generarPasswordSegura = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const length = 12;
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
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
            !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,}$/.test(password)
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
            className="w-full mt-10 px-6 md:px-10 py-10
    bg-gradient-to-br from-white/90 via-gray-100/70 to-white/40
    backdrop-blur-xl backdrop-saturate-150
    border border-white/30 shadow-xl
    rounded-3xl transition-all duration-300"
        >
            <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-lg text-white text-xl">
                    <FiUser size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Perfil de Usuario</h2>
                    <p className="text-sm text-gray-500">Ajusta tu información personal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-8">
                <div>
                    <Text type="subtitle" color="#000">Nombre</Text>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="w-full bg-white/70 text-gray-800 border border-gray-300 rounded-xl p-3 text-center placeholder-gray-400
          focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-200 shadow-sm"
                    />
                </div>

                <div>
                    <Text type="subtitle" color="#000">Correo Electrónico</Text>
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-gray-100/5 text-white border border-white rounded-xl p-3 text-center"
                    />
                </div>

                <div className="relative">
                    <Text type="subtitle" color="#000">
                        Contraseña (opcional)
                        <InfoPopover content="Si no ingresas una nueva, se mantendrá la actual." />
                    </Text>
                    <div className="flex gap-2 mt-1">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nueva contraseña"
                            className="w-full bg-white/70 text-gray-800 border border-gray-300 rounded-xl p-3 pr-10 text-center placeholder-gray-400
            focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-indigo-100 text-gray-600 transition-all"
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                        <button
                            type="button"
                            title="Generar contraseña"
                            onClick={() => setPassword(generarPasswordSegura())}
                            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-indigo-100 text-indigo-600 transition-all"
                        >
                            <FiRefreshCcw />
                        </button>
                    </div>
                </div>

                <div className="mt-3">
                    <Text type="subtitle" color="#000">Rol</Text>
                    <select
                        value={role}
                        disabled
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-gray-100/5 text-white border border-white rounded-xl p-3 text-center"
                    >
                        <option value="">Selecciona un rol</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <Text type="subtitle" color="#000">Firma BPM</Text>
                    <input
                        type="text"
                        value={signature_bpm}
                        onChange={(e) => setSignatureBPM(e.target.value)}
                        placeholder="Firma BPM (opcional)"
                        className="w-full bg-white/70 text-gray-800 border border-gray-300 rounded-xl p-3 text-center placeholder-gray-400
          focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                    />
                </div>

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

            <hr className="my-10 border-t border-gray-300" />

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
