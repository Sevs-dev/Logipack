"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/navbar/Navbar";
import Sidebar from "./components/sidebar/Sidebar";
import { AuthProvider } from "./context/AuthContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navbarRoutes = ["/", "/pages/login", "/pages/register"];
  const showNavbar = navbarRoutes.includes(pathname);

  // Estado para controlar si el sidebar está expandido o colapsado
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (showNavbar) {
    return (
      <div className="min-h-screen">
        <header className="w-full">
          <Navbar />
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AuthProvider>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4">
          {children}
        </main>
      </AuthProvider>
    </div>
  );
}
