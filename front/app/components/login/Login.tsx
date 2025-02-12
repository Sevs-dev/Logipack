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
      // Establece la cookie para que dure 30 minutos (1800 segundos)
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

      router.push('/pages/dashboard');
    } else {
      setErrorMessage(response.message);
    }
    setLoading(false);
  };

  // Variantes para animaciones
  const formVariant = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 1 } },
  };

  const imageVariant = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 1 } },
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Izquierdo: Formulario de Login */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-100 p-8"
        initial="hidden"
        animate="visible"
        variants={formVariant}
      >
        <motion.div className="max-w-md w-full" variants={staggerContainer}>
          <motion.h1 className="text-3xl font-bold mb-6 text-gray-800" variants={fadeIn}>
            Inicia sesión en tu cuenta
          </motion.h1>
          <motion.p className="mb-8 text-gray-600" variants={fadeIn}>
            Ingresa tus credenciales para acceder al panel de control.
          </motion.p>
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow-md"
            variants={staggerContainer}
          >
            <motion.div className="mb-4" variants={fadeIn}>
              <label htmlFor="email" className="block text-gray-700 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>
            <motion.div className="mb-4" variants={fadeIn}>
              <label htmlFor="password" className="block text-gray-700 font-medium">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </motion.div>
            {errorMessage && (
              <motion.div className="mb-4 text-red-500 text-sm" variants={fadeIn}>
                {errorMessage}
              </motion.div>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 transition-colors"
              variants={fadeIn}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>

      {/* Lado Derecho: Imagen de fondo con overlay de texto */}
      <motion.div
        className="hidden md:flex w-1/2 items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: "url('/images/login-background.jpg')" }}
        initial="hidden"
        animate="visible"
        variants={imageVariant}
      >
        <div className="absolute inset-0 bg-blue-900 opacity-50"></div>
        <motion.div className="relative z-10 text-center p-8" variants={staggerContainer}>
          <motion.h2 className="text-4xl text-white font-bold mb-4" variants={fadeIn}>
            Bienvenido a Logismart
          </motion.h2>
          <motion.p className="text-white text-lg" variants={fadeIn}>
            Optimiza y supervisa tus procesos de forma segura y eficiente.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
