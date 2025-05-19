'use client';
import React, { useState } from 'react';
import { login } from '../../services/userDash/authservices';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { motion } from 'framer-motion';

const cookieOptions = {
  maxAge: 30 * 60,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@logismart.com');
  const [password, setPassword] = useState('Logismart123*');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await login(email, password);

      if (response.success) {
        const { token } = response.data.autorización;
        const { email, role, name } = response.data.usuario;

        nookies.set(null, 'token', token, cookieOptions);
        nookies.set(null, 'email', email, cookieOptions);
        nookies.set(null, 'role', role, cookieOptions);
        nookies.set(null, 'name', name, cookieOptions);

        router.push('/pages/dashboard');
      } else {
        setErrorMessage(response.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setErrorMessage('Ocurrió un error inesperado. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 font-sans">
      {/* Formulario */}
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

            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-2 rounded-lg mt-2">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorMessage}
                </p>
              </div>
            )}

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

      {/* Lado visual */}
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

// Subcomponente reutilizable para inputs
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
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm text-gray-200 font-medium">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/20 text-white 
                 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none 
                 transition duration-300"
      placeholder={placeholder}
      required
    />
  </div>
);
