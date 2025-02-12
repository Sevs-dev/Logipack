'use client';
import React, { useState } from 'react';
import { register } from '../../services/authservices';
import { motion } from 'framer-motion';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const response = await register(name, email, password);
    if (response.success) {
      setSuccessMessage('¡Registro exitoso!');
      setName('');
      setEmail('');
      setPassword('');
    } else {
      setErrorMessage(response.message);
    }
    setLoading(false);
  };

  // Variantes para animar los elementos
  const leftVariant = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 1 } },
  };

  const rightVariant = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 1 } },
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
      {/* Lado Izquierdo: Imagen con overlay e información */}
      <motion.div
        className="hidden md:flex w-1/2 items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: "url('/images/register-background.jpg')" }}
        initial="hidden"
        animate="visible"
        variants={leftVariant}
      >
        <div className="absolute inset-0 bg-green-900 opacity-60"></div>
        <motion.div className="relative z-10 text-center p-8" variants={staggerContainer}>
          <motion.h2 className="text-4xl text-white font-bold mb-4" variants={rightVariant}>
            Únete a Logismart
          </motion.h2>
          <motion.p className="text-white text-lg" variants={rightVariant}>
            Regístrate hoy y comienza a optimizar tus procesos con tecnología de punta.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Lado Derecho: Formulario de Registro */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-100 p-8"
        initial="hidden"
        animate="visible"
        variants={rightVariant}
      >
        <motion.div className="max-w-md w-full" variants={staggerContainer}>
          <motion.h1 className="text-3xl font-bold mb-6 text-gray-800" variants={rightVariant}>
            Crea tu cuenta
          </motion.h1>
          <motion.p className="mb-8 text-gray-600" variants={rightVariant}>
            Ingresa tus datos para registrarte en Logismart.
          </motion.p>
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow-md"
            variants={staggerContainer}
          >
            <motion.div className="mb-4" variants={rightVariant}>
              <label htmlFor="name" className="block text-gray-700 font-medium">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </motion.div>
            <motion.div className="mb-4" variants={rightVariant}>
              <label htmlFor="email" className="block text-gray-700 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>
            <motion.div className="mb-4" variants={rightVariant}>
              <label htmlFor="password" className="block text-gray-700 font-medium">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </motion.div>
            {errorMessage && (
              <motion.div className="mb-4 text-red-500 text-sm" variants={rightVariant}>
                {errorMessage}
              </motion.div>
            )}
            {successMessage && (
              <motion.div className="mb-4 text-green-500 text-sm" variants={rightVariant}>
                {successMessage}
              </motion.div>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white p-2 rounded w-full hover:bg-green-600 transition-colors"
              variants={rightVariant}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Register;
