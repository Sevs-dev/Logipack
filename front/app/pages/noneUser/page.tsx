"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import nookies from "nookies";
import { useRouter } from "next/navigation";
export default function UnauthorizedPage() {
    const router = useRouter();
    const handleLogout = () => {
        nookies.destroy(null, "token", { path: "/" });
        nookies.destroy(null, "userName", { path: "/" });
        nookies.destroy(null, "userData", { path: "/" });
        nookies.destroy(null, "role", { path: "/" });
        nookies.destroy(null, "email", { path: "/" });
        router.push("/");
    };
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-green-100 px-4 text-center">
            {/* Vaca saltando y parpadeando */}
            <motion.div
                className="text-7xl mb-4 origin-bottom"
                animate={{
                    y: [0, -8, 0, -4, 0],
                    rotate: [0, -3, 3, -3, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                🐄
            </motion.div>

            {/* Pasto animado como fondo decorativo */}
            <motion.div
                className="text-2xl text-green-800 mb-8"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                🌿🌾🌿🌱🌿
            </motion.div>

            {/* Título con fade */}
            <motion.h1
                className="text-4xl font-bold mb-4 text-green-900"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                401 - ¡Acceso denegado!
            </motion.h1>

            {/* Mensaje con fade */}
            <motion.p
                className="text-lg text-gray-700 mb-8 max-w-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                El usuario ha superado el tiempo límite, cierra sesión e ingresa nuevamente...
            </motion.p>

            {/* Botón animado */}
            <motion.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.95, rotate: -1 }}
            >
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center justify-center p-2"
                >
                    <span className="text-sm ml-2">Cerrar Sesión</span>
                </button>
            </motion.div>
        </div>
    );
}
