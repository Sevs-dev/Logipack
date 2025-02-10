'use client';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Obtenemos el token del localStorage (solo si se ejecuta en el cliente)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  // Determinamos si el usuario está autenticado:
  // se considera autenticado si hay un token o si la ruta actual es '/pages/dashboard'
  const isAuthenticated = token || pathname === '/pages/dashboard';

  const handleHome = () => {
    router.push('/');
  };
  const handleLogin = () => {
    router.push('/pages/login');
  };
  const handleRegister = () => {
    router.push('/pages/register');
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userData');  
    router.push('/pages/login');
  };
  const handlePerfil = () => {
    router.push('/pages/perfil');
  };

  return (
    <nav className="flex justify-around items-center p-4 bg-gray-800">
      <button 
        onClick={handleHome} 
        className="text-white hover:text-gray-300"
      >
        Home
      </button>
      
      {!isAuthenticated && (
        <>
          <button 
            onClick={handleLogin} 
            className="text-white hover:text-gray-300"
          >
            Login
          </button>
          <button 
            onClick={handleRegister} 
            className="text-white hover:text-gray-300"
          >
            Registro
          </button>
        </>
      )}

      {isAuthenticated && (
        <>
          <button 
            onClick={handlePerfil} 
            className="text-white hover:text-gray-300"
          >
            Perfil
          </button>
          <button 
            onClick={handleLogout} 
            className="text-white hover:text-gray-300"
          >
            Cerrar Sesión
          </button>
        </>
      )}
    </nav>
  );
}

export default Navbar;
