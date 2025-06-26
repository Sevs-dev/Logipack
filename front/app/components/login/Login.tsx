'use client';

import React, { useState } from 'react';
import { login } from '../../services/userDash/authservices';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { showError } from '../toastr/Toaster';

const cookieOptions = {
  maxAge: 3600, // 2 horas
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@logismart.com'); // valores por defecto para testing
  const [password, setPassword] = useState('Logismart123*');
  const [loading, setLoading] = useState(false);

  // 🧠 Manejo del envío del formulario de login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(email, password); // Lanza error si falla (401, 422, etc.)

      if (response.success) {
        // 🧠 Desestructuramos token y usuario
        const data = response.data as {
          autorización: { token: string };
          usuario: { email: string; role: string; name: string };
        };

        const { token } = data.autorización;
        const { email, role, name } = data.usuario;

        // 🍪 Guardamos en cookies
        nookies.set(null, 'token', token, cookieOptions);
        nookies.set(null, 'email', email, cookieOptions);
        nookies.set(null, 'role', role, cookieOptions);
        nookies.set(null, 'name', name, cookieOptions);

        window.location.href = '/pages/dashboard';

      }
    } catch (err) {
      // console.log('Error capturado:', err);
      if (err instanceof Error) {
        showError(err.message);
      } else {
        showError('Error inesperado al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✨ Animación simple para entrada
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 font-sans">
      {/* FORMULARIO DE LOGIN */}
      <motion.div
        className="relative z-10 w-full md:w-1/2 flex items-center justify-center p-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Inicia sesión</h1>
            <p className="text-sm text-gray-300">Accede al panel de control de Logismart</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="ej: admin@logismart.com"
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="********"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 
                         text-white font-semibold hover:from-purple-700 hover:to-indigo-800 
                         shadow-lg hover:shadow-xl transition-all duration-300 transform 
                         hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </motion.div>

      {/* PANEL DERECHO DE BIENVENIDA */}
      <motion.div
        className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-950/70 blur-2xl"></div>
        <div className="relative z-10 text-center text-white px-10">
          <h2 className="text-6xl font-bold mb-4 drop-shadow-2xl tracking-tight">
            Bienvenido a<br />Logismart
          </h2>
          <p className="text-lg text-gray-200/90 font-medium tracking-wide">
            Optimiza tus procesos.<br />Visualiza tu éxito.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// 💡 Input reutilizable para email/contraseña
const Input = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-2 relative">
      <label htmlFor={id} className="block text-sm text-gray-200 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3.5 pr-12 rounded-lg bg-white/5 border border-white/20 text-white 
                     placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none 
                     transition duration-300"
          placeholder={placeholder}
          required
        />

        {/* 👁 Icono para mostrar/ocultar contraseña */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 bottom-[0.9rem] text-gray-300 hover:text-white z-10"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={showPassword ? 'visible' : 'hidden'}
                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>
    </div>
  );
};