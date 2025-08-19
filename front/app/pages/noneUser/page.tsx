"use client";
import { motion } from "framer-motion";
import nookies from "nookies";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const deleteCookie = (name: string) => {
    // Si la cookie no es HttpOnly, esto ayuda
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    // nookies: borra en client con el mismo path
    nookies.destroy(null, name, { path: "/" });
  };

  const handleLogout = () => {
    ["token", "username", "name", "role", "email"].forEach(deleteCookie);
    router.push("/pages/login");
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
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        🐄
      </motion.div>

      {/* Pasto animado */}
      <motion.div
        className="text-2xl text-green-800 mb-8"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🌿🌾🌿🌱🌿
      </motion.div>

      {/* Título */}
      <motion.h1
        className="text-4xl font-bold mb-4 text-green-900"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        401 - ¡Acceso denegado!
      </motion.h1>

      {/* Mensaje */}
      <motion.p
        className="text-lg text-gray-700 mb-8 max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        El usuario ha superado el tiempo límite, cierra sesión e ingresa
        nuevamente...
      </motion.p>

      {/* Botón animado */}
      <motion.button
        type="button"
        onClick={handleLogout}
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.95, rotate: -1 }}
        className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center justify-center p-2"
        aria-label="Cerrar sesión"
      >
        <span className="text-sm ml-1">Cerrar Sesión</span>
      </motion.button>
    </div>
  );
}
