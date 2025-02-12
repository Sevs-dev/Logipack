"use client";
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import nookies from 'nookies';

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validación del token
  useEffect(() => {
    if (!mounted) return;

    const cookies = nookies.get(null);
    const token = cookies.token;
    if (token) {
      try {
        const decoded = parseJwt(token);
        if (decoded.exp > Date.now() / 1000) {
          setIsAuthenticated(true);
        } else {
          nookies.destroy(null, 'token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [mounted, router, pathname]);

  // Renovación de la cookie en cada cambio de ruta
  useEffect(() => {
    const cookies = nookies.get(null);
    if (cookies.token) {
      nookies.set(null, 'token', cookies.token, {
        maxAge: 30 * 60, // 30 minutos
        path: '/',
      });
    }
  }, [pathname]);

  // Funciones de navegación
  const handleHome = () => {
    setMenuOpen(false);
    router.push('/');
  };
  const handleLogin = () => {
    setMenuOpen(false);
    router.push('/pages/login');
  };
  const handleRegister = () => {
    setMenuOpen(false);
    router.push('/pages/register');
  };
  const handleDashBoard = () => {
    setMenuOpen(false);
    router.push('/pages/dashboard');
  };
  const handleLogout = () => {
    setMenuOpen(false);
    nookies.destroy(null, 'token', { path: '/' });
    nookies.destroy(null, 'userName', { path: '/' });
    nookies.destroy(null, 'userData', { path: '/' });
    router.push('/');
  };
  
  const handlePerfil = () => {
    setMenuOpen(false);
    router.push('/pages/perfil');
  };

  if (!mounted) {
    return null;
  }

  // Renderizado de enlaces del navbar
  const renderNavLinks = () => (
    <>
      {/* <button
        onClick={handleHome}
        className="px-4 py-2 rounded-md text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition duration-300"
      >
        Home
      </button> */}
      {!isAuthenticated ? (
        <>
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-md text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition duration-300"
          >
            Login
          </button>
          <button
            onClick={handleRegister}
            className="px-4 py-2 rounded-md text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition duration-300"
          >
            Registro
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleDashBoard}
            className="px-4 py-2 rounded-md text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition duration-300"
          >
            Dashboard
          </button>
          <button
            onClick={handlePerfil}
            className="px-4 py-2 rounded-md text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition duration-300"
          >
            Perfil
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition duration-300"
          >
            Cerrar Sesión
          </button>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Branding */}
          <div className="flex-shrink-0 flex items-center">
            <div
              onClick={handleHome}
              className="cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              <img src="/logipack_2.png" alt="Logipack" className="h-10 w-auto" />
            </div>
          </div>
          {/* Enlaces en pantallas medianas y grandes */}
          <div className="hidden md:flex space-x-4">
            {renderNavLinks()}
          </div>
          {/* Botón para menú móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none transition duration-300"
            >
              {menuOpen ? (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Menú desplegable para móviles con animación */}
      {menuOpen && (
        <div className="md:hidden transition-all duration-300 ease-out transform origin-top">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {renderNavLinks()}
          </div>
        </div>
      )}
    </nav>
  );
}

// Función para decodificar el payload de un JWT sin librerías adicionales
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
}

export default Navbar;
