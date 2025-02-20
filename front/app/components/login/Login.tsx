'use client';
import React, { useState } from 'react';
import { login } from '../../services/authservices';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { motion } from 'framer-motion';

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@logismart.com');
  const [password, setPassword] = useState('Logismart123*');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const response = await login(email, password);
    if (response.success) {
      nookies.set(null, 'token', response.data.autorización.token, {
        maxAge: 30 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      nookies.set(null, 'email', response.data.usuario.email, {
        maxAge: 30 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      nookies.set(null, 'role', response.data.usuario.role, {
        maxAge: 30 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      router.push('/pages/dashboard');
    } else {
      setErrorMessage(response.message);
    }
    setLoading(false);
  };

  // Animaciones
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Lado Izquierdo: Formulario de Login */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-center justify-center p-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Inicia sesión</h1>
          <p className="mb-8 text-gray-600">Ingresa tus credenciales para acceder al panel de control.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Lado Derecho: Imagen de fondo con overlay de texto */}
      <motion.div
        className="hidden md:flex w-1/2 items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: "url('/images/login-background.jpg')" }}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center p-8">
          <h2 className="text-5xl text-white font-bold mb-4">Bienvenido a Logismart</h2>
          <p className="text-white text-xl">Optimiza y supervisa tus procesos de forma segura y eficiente.</p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;