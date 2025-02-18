"use client";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import nookies from "nookies";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const token = nookies.get(null)?.token;
    if (token) {
      try {
        const decoded = parseJwt(token);
        setIsAuthenticated(decoded.exp > Date.now() / 1000);
      } catch {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [mounted, router, pathname]);

  useEffect(() => {
    const token = nookies.get(null)?.token;
    if (token) {
      nookies.set(null, "token", token, { maxAge: 30 * 60, path: "/" });
    }
  }, [pathname]);

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  if (!mounted) return null;

  return (
   <motion.nav
  className="fixed top-0 left-0 w-full bg-black/40 backdrop-blur-lg shadow-md z-50 px-6 py-3 rounded-b-xl"
  initial={{ opacity: 0, y: -30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>

      <div className="flex justify-between items-center">
        {/* Logo */}
        <motion.div
          onClick={() => handleNavigation("/")}
          className="cursor-pointer flex items-center gap-2"
          whileHover={{ scale: 1.1 }}
        >
          <img src="/logipack_2.png" alt="Logipack" className="h-10 w-auto" />
          <span className="text-white text-lg font-semibold">Logipack</span>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-4">
          {isAuthenticated ? (
            <>
              <NavButton onClick={() => handleNavigation("/pages/dashboard")}>Dashboard</NavButton>
              <NavButton onClick={() => handleNavigation("/pages/perfil")}>Perfil</NavButton>
              <NavButton onClick={() => handleNavigation("/")} logout>
                Cerrar Sesión
              </NavButton>
            </>
          ) : (
            <NavButton onClick={() => handleNavigation("/pages/login")}>Login</NavButton>
          )}
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          whileHover={{ scale: 1.1 }}
        >
          {menuOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
            {menuOpen && (
          <motion.div
          className="absolute top-14 left-0 w-full bg-black/40 backdrop-blur-lg shadow-xl py-4 md:hidden rounded-b-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
        
            <div className="flex flex-col space-y-3 px-6">
              {isAuthenticated ? (
                <>
                  <NavButton onClick={() => handleNavigation("/pages/dashboard")}>Dashboard</NavButton>
                  <NavButton onClick={() => handleNavigation("/pages/perfil")}>Perfil</NavButton>
                  <NavButton onClick={() => handleNavigation("/")} logout>
                    Cerrar Sesión
                  </NavButton>
                </>
              ) : (
                <NavButton onClick={() => handleNavigation("/pages/login")}>Login</NavButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// Botón estilizado con animaciones
const NavButton = ({ onClick, children, logout = false }: { onClick: () => void; children: React.ReactNode; logout?: boolean }) => (
  <motion.button
    onClick={onClick}
    className={`px-6 py-2 text-white font-semibold rounded-full transition-all duration-300 ${
      logout
        ? "bg-red-600 hover:bg-red-700"
        : "bg-blue-500 hover:bg-blue-600"
    } shadow-md`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.button>
);

// Decodificar JWT
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default Navbar;
