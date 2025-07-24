"use client";

import React, { useState, useEffect } from "react";
import {
  FaHome, FaVials, FaCog, FaFileInvoice, FaAngleDown, FaSignOutAlt,
  FaChartLine, FaArrowLeft, FaBars, FaIoxhost, FaBook, FaBorderAll,
  FaDolly, FaCalendarAlt, FaBookmark
} from "react-icons/fa";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUserByEmail } from "../../services/userDash/authservices";
import Image from 'next/image';
import SidebarFlyoutPortal from "./SidebarFlyoutPortal";

// ---- Custom Hook para Mobile ----
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

// ---- Types ----
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  link?: string;
  children?: MenuItem[];
}

// ---- Menu Data ----
const menuItems: MenuItem[] = [
  {
    key: "inicio",
    label: "Inicio",
    link: "/pages/dashboard",
    icon: <FaHome />,
  },
  {
    key: "seteos",
    label: "Seteos",
    icon: <FaBook />,
    children: [
      {
        key: "maestras",
        label: "Config. de Maestras",
        icon: <FaVials />,
        link: "/pages/maestra",
      },
      {
        key: "bom",
        label: "Config. de BOM",
        icon: <FaIoxhost />,
        link: "/pages/bom",
      },
    ],
  },
  {
    key: "datos",
    label: "Datos",
    icon: <FaBorderAll />,
    children: [
      {
        key: "ordenes",
        label: "Ordenes de Acon.",
        icon: <FaFileInvoice />,
        link: "/pages/adaptation",
      },
      {
        key: "planing",
        label: "Gestión de Ordenes",
        icon: <FaBookmark />,
        link: "/pages/planificacion",
      },
    ],
  },
  {
    key: "analisis",
    label: "Analisis",
    icon: <FaChartLine />,
    children: [
      {
        key: "inventario",
        label: "Inventario",
        icon: <FaDolly />,
        link: "/pages/inventory",
      },
      {
        key: "calendario",
        label: "Calendario",
        icon: <FaCalendarAlt />,
        link: "/pages/calendar",
      }
    ],
  },
  {
    key: "ajustes",
    label: "Ajustes",
    icon: <FaCog />,
    children: [
      { key: "general", label: "General", icon: <FaCog />, link: "/pages/perfil" },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number, left: number } | null>(null);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isAuthenticated = Boolean(nookies.get(null).token);

  // Carga datos de usuario si está autenticado
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookies = nookies.get(null);
        const email = cookies.email;
        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const user = await getUserByEmail(decodedEmail);
          if (user.usuario && typeof user.usuario === "object" && "name" in user.usuario) {
            setUserName((user.usuario as { name?: string }).name || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    if (isMobile) setSidebarOpen(false);
    ["token", "userName", "userData", "email", "role"].forEach((c) =>
      nookies.destroy(null, c, { path: "/" })
    );
    router.push("/");
  };

  // ---- Helpers para activos ----
  const isMenuItemActive = (item: MenuItem) => {
    if (item.link && pathname === item.link) return true;
    if (item.children && item.children.some(child => child.link === pathname)) return true;
    return false;
  };
  const isSubMenuItemActive = (subItem: MenuItem) => subItem.link === pathname;

  // ---- Render ----
  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 64 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="h-screen sticky top-0 bg-[#242424] z-20"
    >
      <div className="h-full w-full bg-[#242424] backdrop-blur-lg rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"
            } p-4 border-b border-white/20`}
        >
          {sidebarOpen && (
            <Image
              src="/logipack_2.png"
              alt="Logipack"
              width={60}
              height={40}
              priority
            />
          )}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
            aria-label={sidebarOpen ? "Cerrar Sidebar" : "Abrir Sidebar"}
            tabIndex={0}
          >
            {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) =>
            item.children ? (
              <div
                key={item.key}
                onMouseEnter={e => {
                  if (sidebarOpen) {
                    setOpenSubMenus((prev) => ({ ...prev, [item.key]: true }));
                  } else {
                    setHoveredMenu(item.key);

                    // Calcula la posición del ítem para el flyout
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setFlyoutPosition({
                      top: rect.top,
                      left: rect.right + 6, // Ajusta el offset a gusto
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (sidebarOpen) {
                    setOpenSubMenus((prev) => ({ ...prev, [item.key]: false }));
                  } else {
                    setHoveredMenu(null);
                    setFlyoutPosition(null);
                  }
                }}
                className="relative"
              >
                {/* Botón principal */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={!!openSubMenus[item.key]}
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                    } else {
                      setOpenSubMenus((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }));
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!sidebarOpen) setSidebarOpen(true);
                      else setOpenSubMenus((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }));
                    }
                  }}
                  className={`relative cursor-pointer p-2 hover:bg-white/20 rounded transition-colors select-none ${sidebarOpen ? "flex items-center" : "flex justify-center"
                    } group`}
                  style={{
                    borderLeft: isMenuItemActive(item) ? "4px solid #eab308" : "4px solid transparent",
                    background: isMenuItemActive(item) ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  <span className="text-lg text-white mr-2">{item.icon}</span>
                  {sidebarOpen && (
                    <div className="flex items-center w-full">
                      <span className="text-white mr-2">{item.label}</span>
                      <span className="ml-auto text-white transition-transform duration-300 transform">
                        <FaAngleDown
                          className={`${openSubMenus[item.key] ? "rotate-180" : ""}`}
                        />
                      </span>
                    </div>
                  )}
                </div>

                {/* Flyout portal para submenu */}
                <AnimatePresence>
                  {!sidebarOpen && hoveredMenu === item.key && flyoutPosition && (
                    <SidebarFlyoutPortal>
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.18 }}
                        className="fixed z-[9999] min-w-[180px] bg-[#232323] rounded-xl shadow-xl border border-gray-700 py-2"
                        style={{
                          top: flyoutPosition.top,
                          left: flyoutPosition.left,
                          boxShadow: "0 2px 12px 0 #00000060"
                        }}
                        // Soporta mantener abierto el flyout si pasas el mouse rápido al submenú
                        onMouseLeave={() => {
                          setHoveredMenu(null);
                          setFlyoutPosition(null);
                        }}
                        onMouseEnter={() => setHoveredMenu(item.key)}
                      >
                        {item.children.map((subItem) => (
                          <div
                            key={subItem.key}
                            role="button"
                            tabIndex={0}
                            aria-current={isSubMenuItemActive(subItem)}
                            className="flex items-center cursor-pointer p-2 hover:bg-white/20 rounded transition-colors select-none"
                            onClick={() => {
                              if (subItem.link) router.push(subItem.link);
                              setHoveredMenu(null);
                              setFlyoutPosition(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (subItem.link) router.push(subItem.link);
                                setHoveredMenu(null);
                                setFlyoutPosition(null);
                              }
                            }}
                            style={{
                              borderLeft: isSubMenuItemActive(subItem)
                                ? "3px solid #22d3ee"
                                : "3px solid transparent",
                              background: isSubMenuItemActive(subItem)
                                ? "rgba(34,211,238,0.1)"
                                : "transparent",
                              transition: "border-color 0.2s, background 0.2s",
                            }}
                          >
                            <span className="text-lg text-white mr-2">{subItem.icon}</span>
                            <span className="text-white">{subItem.label}</span>
                          </div>
                        ))}
                      </motion.div>
                    </SidebarFlyoutPortal>
                  )}
                </AnimatePresence>

                {/* Submenú tradicional cuando sidebar está abierto */}
                <AnimatePresence initial={false}>
                  {openSubMenus[item.key] && sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="ml-8 overflow-hidden"
                    >
                      {item.children.map((subItem) => (
                        <div
                          key={subItem.key}
                          role="button"
                          tabIndex={0}
                          aria-current={isSubMenuItemActive(subItem)}
                          className="flex items-center cursor-pointer p-2 hover:bg-white/20 rounded transition-colors select-none"
                          onClick={() =>
                            subItem.link && router.push(subItem.link)
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (subItem.link) router.push(subItem.link);
                            }
                          }}
                          style={{
                            borderLeft: isSubMenuItemActive(subItem)
                              ? "3px solid #22d3ee"
                              : "3px solid transparent",
                            background: isSubMenuItemActive(subItem)
                              ? "rgba(34,211,238,0.1)"
                              : "transparent",
                            transition: "border-color 0.2s, background 0.2s",
                          }}
                        >
                          <span className="text-lg text-white mr-2">{subItem.icon}</span>
                          {sidebarOpen && (
                            <span className="text-white">{subItem.label}</span>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div key={item.key}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-current={isMenuItemActive(item)}
                  onClick={() => item.link && router.push(item.link)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (item.link) router.push(item.link);
                    }
                  }}
                  className={`relative cursor-pointer p-2 hover:bg-white/20 rounded transition-colors select-none ${sidebarOpen ? "flex items-center" : "flex justify-center"
                    }`}
                  style={{
                    borderLeft: isMenuItemActive(item) ? "4px solid #eab308" : "4px solid transparent",
                    background: isMenuItemActive(item) ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  <span className="text-lg text-white mr-2">{item.icon}</span>
                  {sidebarOpen && (
                    <div className="flex items-center">
                      <span className="text-white">{item.label}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="mt-auto p-3 border-t border-white/20">
          <div className="mb-2 flex items-center">
            <Image
              src="/avatar.png"
              alt={userName || "Usuario"}
              width={40}
              height={40}
              priority
              className="w-[40px] h-[40px] rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push("/pages/userProfile")}
            />
            {sidebarOpen && (
              <span className="ml-2 text-white font-medium truncate max-w-[120px]">
                {userName}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center justify-center p-2"
          >
            <FaSignOutAlt className="text-xl" />
            {sidebarOpen && (
              <span className="text-sm ml-2">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
