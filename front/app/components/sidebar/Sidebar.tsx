"use client";

import React, { useState, useEffect } from "react";
import { FaHome, FaVials, FaCog, FaFileInvoice, FaAngleDown, FaSignOutAlt, FaChartLine, FaArrowLeft, FaBars, FaIoxhost, FaBook, FaBorderAll, FaDolly, FaCalendarAlt } from "react-icons/fa";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUserByEmail } from "../../services/userDash/authservices";
import Image from 'next/image';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  link?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Inicio",
    link: "/pages/dashboard",
    icon: <FaHome />,
  },
  {
    label: "Seteos",
    icon: <FaBook />,
    children: [
      {
        label: "Config. de Maestras",
        icon: <FaVials />,
        link: "/pages/maestra",
      },
      {
        label: "Config. de BOM",
        icon: <FaIoxhost />,
        link: "/pages/bom",
      },
    ],
  },
  {
    label: "Datos",
    icon: <FaBorderAll />,
    children: [
      {
        label: "Ordenes de Acon.",
        icon: <FaFileInvoice />,
        link: "/pages/adaptation",
      },
      // {
      //   label: "Planificacion",
      //   icon: <FaBookmark />,
      //   link: "/pages/planificacion",
      // },
      // {
      //   label: "Órdenes",
      //   icon: <FaCheckDouble />,
      //   link: "/pages/ordenes_ejecutadas",
      // },
    ],
  },
  {
    label: "Analisis",
    icon: <FaChartLine />,
    children: [
      {
        label: "Inventario",
        icon: <FaDolly />,
        link: "/pages/inventory",
      },
      {
        label: "Calendario",
        icon: <FaCalendarAlt />,
        link: "/pages/calendar",
      }
    ],
  },
  {
    label: "Ajustes",
    icon: <FaCog />,
    children: [
      { label: "General", icon: <FaCog />, link: "/ajustes/general" },
      { label: "Seguridad", icon: <FaCog />, link: "/ajustes/seguridad" },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: number]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = Boolean(nookies.get(null).token);


  // Detecta tamaño de pantalla para comportamiento mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    nookies.destroy(null, "token", { path: "/" });
    nookies.destroy(null, "userName", { path: "/" });
    nookies.destroy(null, "userData", { path: "/" });
    nookies.destroy(null, "email", { path: "/" });
    nookies.destroy(null, "role", { path: "/" });
    router.push("/");
  };

  // Funciones para determinar el estado activo
  const isMenuItemActive = (item: MenuItem) => {
    if (item.link && pathname === item.link) return true;
    if (item.children && item.children.some(child => child.link === pathname)) return true;
    return false;
  };

  const isSubMenuItemActive = (subItem: MenuItem) => subItem.link === pathname;

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 64 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="h-screen sticky top-0 bg-[#242424]"
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
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          )}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
            aria-label={sidebarOpen ? "Cerrar Sidebar" : "Abrir Sidebar"}
          >
            {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item, index) =>
            item.children ? (
              <div
                key={index}
                onMouseEnter={() =>
                  sidebarOpen &&
                  setOpenSubMenus((prev) => ({ ...prev, [index]: true }))
                }
                onMouseLeave={() =>
                  sidebarOpen &&
                  setOpenSubMenus((prev) => ({ ...prev, [index]: false }))
                }
              >
                <div
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                    } else {
                      setOpenSubMenus((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }));
                    }
                  }}
                  className={`cursor-pointer p-2 hover:bg-white/20 rounded transition-colors ${sidebarOpen ? "flex items-center" : "flex justify-center"
                    }`}
                >
                  <span className="text-lg text-white mr-2">{item.icon}</span>
                  {sidebarOpen && (
                    <div className="flex items-center w-full">
                      <span className="text-white mr-2">{item.label}</span>
                      {isMenuItemActive(item) && (
                        <motion.span
                          className="w-2 h-2 rounded-full"
                        />
                      )}
                      <span className="ml-auto text-white transition-transform duration-300 transform">
                        <FaAngleDown
                          className={`${openSubMenus[index] ? "rotate-180" : ""}`}
                        />
                      </span>
                    </div>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {openSubMenus[index] && sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="ml-8 overflow-hidden"
                    >
                      {item.children.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className="flex items-center cursor-pointer p-2 hover:bg-white/20 rounded transition-colors"
                          onClick={() =>
                            subItem.link && router.push(subItem.link)
                          }
                        >
                          <span className="text-lg text-white mr-2">
                            {subItem.icon}
                          </span>
                          {sidebarOpen && (
                            <div className="flex items-center">
                              <span className="text-white">{subItem.label}</span>
                              {isSubMenuItemActive(subItem) && (
                                <motion.span
                                  className="w-2 h-2 rounded-full ml-2"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div key={index}>
                <div
                  onClick={() => item.link && router.push(item.link)}
                  className={`cursor-pointer p-2 hover:bg-white/20 rounded transition-colors ${sidebarOpen ? "flex items-center" : "flex justify-center"
                    }`}
                >
                  <span className="text-lg text-white mr-2">{item.icon}</span>
                  {sidebarOpen && (
                    <div className="flex items-center">
                      <span className="text-white">{item.label}</span>
                      {isMenuItemActive(item) && (
                        <motion.span
                          className="w-2 h-2 rounded-full ml-2"
                        />
                      )}
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
              src="/user.jpg"
              alt={userName}
              width={40}
              height={40}
              className="rounded-full object-cover cursor-pointer"
              onClick={() => router.push("/pages/perfil")}
            />
            {sidebarOpen && (
              <span className="ml-2 text-white font-medium">
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
