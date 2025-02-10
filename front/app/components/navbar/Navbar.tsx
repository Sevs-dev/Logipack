"use client";
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import nookies from 'nookies';

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validación del token (esto se mantiene en tu código actual)
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

  // Aquí renovamos la cookie en cada cambio de ruta
  useEffect(() => {
    const cookies = nookies.get(null);
    if (cookies.token) {
      // Reescribe la cookie "token" con un maxAge de 30 minutos (30 * 60 segundos)
      nookies.set(null, 'token', cookies.token, {
        maxAge: 30 * 60,
        path: '/',
      });
    }
  }, [pathname]);

  // Funciones de navegación
  const handleHome = () => router.push('/');
  const handleLogin = () => router.push('/pages/login');
  const handleRegister = () => router.push('/pages/register');
  const handleDashBoard = () => router.push('/pages/dashboard');
  const handleLogout = () => {
    nookies.destroy(null, 'token');
    nookies.destroy(null, 'userName');
    nookies.destroy(null, 'userData');
    router.push('/pages/login');
  };
  const handlePerfil = () => router.push('/pages/perfil');

  if (!mounted) {
    return null;
  }

  return (
    <nav className="flex justify-around items-center p-4 bg-gray-800">
      <button onClick={handleHome} className="text-white hover:text-gray-300">
        Home
      </button>
      {!isAuthenticated ? (
        <>
          <button onClick={handleLogin} className="text-white hover:text-gray-300">
            Login
          </button>
          <button onClick={handleRegister} className="text-white hover:text-gray-300">
            Registro
          </button>
        </>
      ) : (
        <>
          <button onClick={handleDashBoard} className="text-white hover:text-gray-300">
            Dashboard
          </button>
          <button onClick={handlePerfil} className="text-white hover:text-gray-300">
            Perfil
          </button>
          <button onClick={handleLogout} className="text-white hover:text-gray-300">
            Cerrar Sesión
          </button>
        </>
      )}
    </nav>
  );
}

// Función para decodificar el payload de un JWT sin usar librerías adicionales
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
}

export default Navbar;
