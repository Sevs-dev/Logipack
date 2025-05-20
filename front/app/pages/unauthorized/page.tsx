"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-100 px-4 text-center">
      {/* Vaca saltando y parpadeando */}
      <motion.div
        className="text-7xl mb-2 origin-bottom"
        animate={{ 
          y: [0, -10, 0, -5, 0],
          rotate: [0, -2, 2, -2, 0], 
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        🐄
      </motion.div>

      {/* Pasto animado como fondo decorativo */}
      <motion.div
        className="text-2xl text-green-800 mb-6"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🌿🌾🌿🌱🌿
      </motion.div>

      {/* Título con fade */}
      <motion.h1
        className="text-4xl font-bold mb-2 text-green-900"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        401 - ¡Acceso denegado!
      </motion.h1>

      {/* Mensaje con delay */}
      <motion.p
        className="text-lg text-gray-700 mb-6 max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Solo personal autorizado...
      </motion.p>

      {/* Botón animado */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.95, rotate: -1 }}
      >
        <Link
          href="/pages/login"
          className="inline-block bg-green-700 text-white px-5 py-2 rounded-md hover:bg-green-800 transition"
        >
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  );
}

