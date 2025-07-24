'use client';

import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { login } from '../../services/userDash/authservices';
import nookies from 'nookies';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import { showError } from '../toastr/Toaster';
import DateLoader from '@/app/components/loader/DateLoader';

// Fondo animado Aurora + partículas
const bgStyle: CSSProperties = {
  background: 'linear-gradient(152deg,rgba(0, 0, 0, 1) 0%, rgba(36, 54, 158, 1) 51%, rgba(133, 0, 148, 1) 100%)',
  minHeight: '100vh',
  width: '100vw',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: -1,
  overflow: 'hidden',
};

const cookieOptions = {
  maxAge: 60 * 60 * 2,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(email, password);
      if (response.success) {
        const data = response.data as {
          autorización: { token: string };
          usuario: { email: string; role: string; name: string };
        };
        const { token } = data.autorización;
        const { email, role, name } = data.usuario;

        nookies.set(null, 'token', token, cookieOptions);
        nookies.set(null, 'email', email, cookieOptions);
        nookies.set(null, 'role', role, cookieOptions);
        nookies.set(null, 'name', name, cookieOptions);

        setTimeout(() => {
          window.location.href = '/pages/dashboard';
        }, 100);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error inesperado al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Animación padre
  const parentFade = {
    hidden: { opacity: 0, scale: 0.98, y: 36 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  // Paneles stagger
  const childFade = {
    hidden: { opacity: 0, x: 60 },
    visible: (i = 1) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.11, duration: 0.45 },
    }),
  };

  return (
    <>
      {loading && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ pointerEvents: "all" }}
        >
          <DateLoader message="Iniciando sesión..." backgroundColor="transparent" color="#fff" />
        </div>
      )}
      <div
        className={`
        relative flex min-h-screen w-full items-center justify-center 
        px-2 sm:px-6 py-8
        overflow-y-auto
        bg-none
      `}
        style={{ background: 'none' }}
      >
        {/* Fondo animado */}
        <div style={bgStyle}>
          <Bubbles />
        </div>

        {/* CONTENEDOR CENTRAL MEJORADO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 48 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", stiffness: 62, damping: 18, duration: 0.84 },
          }}
          whileHover={{
            scale: 1.018,
            boxShadow: '0 0 60px 0 rgba(128,64,255,0.15), 0 20px 90px 0 rgba(78,33,202,0.24)',
            transition: { duration: 0.34 }
          }}
          variants={parentFade}
          className={`
          login-card-main relative
          w-full max-w-4xl mx-auto flex flex-col-reverse md:flex-row rounded-3xl 
          bg-gradient-to-br from-[#25114799] via-[#220a34cc] to-[#47218b7e] 
          animate-glow border border-white/10 backdrop-blur-[8px] overflow-hidden
          shadow-[0_12px_56px_0_rgba(80,50,180,0.38)] 
          ring-2 ring-purple-700/25 
          transition-all duration-300 group mt-10
        `}
          style={{
            boxShadow: '0 20px 90px 0 rgba(78, 33, 202, 0.22)'
          }}
        >
          {/* Glow animado alrededor */}
          <span className="pointer-events-none absolute -inset-2 z-0 rounded-[2.1rem] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-700/40 via-indigo-500/10 to-transparent blur-[36px] opacity-80 animate-bgshine" />

          {/* PANEL IZQUIERDO */}
          <motion.div
            className="flex-1 flex items-center justify-center px-6 py-10 md:p-14 bg-white/20 z-10"
            variants={childFade}
            custom={1}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.16, duration: 0.6, type: 'spring' }}
              className="relative z-10 text-left md:text-center"
            >
              <h2 className="text-3xl xs:text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-2xl tracking-tight text-white animate-fadein">
                Bienvenido a Logismart
              </h2>
              <p className="text-lg md:text-xl text-gray-200/90 font-medium tracking-wide animate-fadein-slow">
                Automatiza, controla, <span className="text-purple-300 font-semibold">optimiza</span>.<br />
                Tu operación, más inteligente.
              </p>
            </motion.div>
          </motion.div>
          {/* FORMULARIO DE LOGIN */}
          <motion.div
            className="flex-1 flex items-center justify-center px-6 py-10 md:p-14 bg-black/40 z-10"
            variants={childFade}
            custom={2}
          >
            <div>
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-xl tracking-wide">Inicia sesión</h1>

              </div>
              <form onSubmit={handleSubmit} className="space-y-7">
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="ej: admin@logismart.com"
                  Icon={FiMail}
                />
                <Input
                  id="password"
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="********"
                  Icon={FiLock}
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.045 }}
                  className="
                  w-full py-3.5 rounded-lg 
                  bg-gradient-to-r from-purple-600 to-indigo-700
                  text-white font-semibold
                  hover:from-purple-700 hover:to-indigo-900
                  shadow-lg hover:shadow-xl
                  transition-all duration-300
                  flex items-center justify-center gap-2 focus:ring-2 focus:ring-purple-400/60
                  active:scale-95
                  tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    Iniciar Sesión
                  </span>
                </motion.button>

                <p className="text-sm text-gray-400 text-center mt-4">
                  ¿Se te olvido la contraseña?{' '} <br />
                  <a href="" className="text-purple-300 hover:underline">
                    Comunicate con un administrador para mas información
                  </a>
                </p>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* Animaciones Keyframes y media query para mobile */}
        <style jsx>{`
        @media (max-width: 640px) {
          .xs\\:max-w-sm { max-width: 90vw; }
          .xs\\:text-4xl { font-size: 2.2rem; }
          .xs\\:p-9 { padding: 2.3rem; }
        }
        @media (max-width: 500px) {
          .login-card-main {
            margin-top: 10vh !important;
            margin-bottom: 8vh !important;
            min-height: unset !important;
            height: auto !important;
          }
        }
        @keyframes gradient-slow {
          0% { background-position: 0% 50%;}
          50% { background-position: 100% 50%;}
          100% { background-position: 0% 50%;}
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradient-slow 8s ease-in-out infinite;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: none;}
        }
        .animate-fadein { animation: fadein 1.15s cubic-bezier(0.4,0,0.2,1) both;}
        .animate-fadein-slow { animation: fadein 2.2s cubic-bezier(0.4,0,0.2,1) both;}

        /* GLOW/SOMBRA animada en el contenedor */
        @keyframes glow {
          0% { box-shadow: 0 0 40px 0 rgba(128,64,255,0.08), 0 20px 90px 0 rgba(78,33,202,0.19);}
          50% { box-shadow: 0 0 80px 8px rgba(178,98,255,0.19), 0 20px 90px 0 rgba(78,33,202,0.27);}
          100% { box-shadow: 0 0 40px 0 rgba(128,64,255,0.08), 0 20px 90px 0 rgba(78,33,202,0.19);}
        }
        .animate-glow { animation: glow 5.5s ease-in-out infinite; }

        @keyframes bgshine {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        .animate-bgshine { animation: bgshine 6.6s ease-in-out infinite; }
      `}</style>
      </div>
    </>
  );
}

// Input PRO con micro-animaciones
const Input = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  Icon,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  Icon?: React.ElementType;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const hasValue = value && value.length > 0;

  return (
    <div className="space-y-2 relative">
      <label htmlFor={id} className="block text-sm text-gray-200 font-medium tracking-wide mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200
              ${hasValue ? 'text-purple-700' : 'text-purple-300/70'}`}
            size={19}
          />
        )}
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={isPassword ? 'current-password' : 'on'}
          className={`
            w-full px-11 py-3.5 pr-12 rounded-lg
            border border-white/40
            transition duration-300 shadow-md shadow-purple-700/10 hover:shadow-purple-400/10 focus:shadow-purple-500/25
            ${Icon ? 'pl-10' : ''}
            ${hasValue
              ? 'bg-gray-100 text-black placeholder-gray-500 focus:bg-gray-100'
              : 'bg-white/10 text-white placeholder-gray-400 focus:bg-gradient-to-l focus:from-purple-700/15 focus:to-indigo-900/15'
            }
            focus:ring-2 focus:ring-purple-500/60 outline-none
          `}
          placeholder={placeholder}
          required
        />
        {/* Botón mostrar/ocultar password igual que antes */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-700 hover:text-white z-10"
            tabIndex={-1}
            aria-label="Mostrar/ocultar contraseña"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={showPassword ? 'visible' : 'hidden'}
                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                transition={{ duration: 0.17 }}
              >
                {showPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>
    </div>
  );
};

// Burbujas/partículas animadas para el fondo
function Bubbles() {
  // Niveles de locura de las burbujas
  const total = 44;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(total)].map((_, i) => {
        // Aleatoriedad total para que nunca se vean igual
        const size = 26 + Math.random() * 56;
        const left = Math.random() * 97;
        const bottom = Math.random() * 80;
        const opacity = 0.28 + Math.random() * 0.33;
        const blur = 2.4 + Math.random() * 1.9;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: `${bottom}%`,
              opacity,
              filter: `blur(${blur}px)`,
            }}
            animate={{
              y: [0, -60 - Math.random() * 140, 0],
              scale: [1, 1.08 + Math.random() * 0.15, 1],
            }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 9 + Math.random() * 5,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}
