"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/navbar/Navbar";
import Sidebar from "./components/sidebar/Sidebar";
import Toaster from "./components/toastr/Toaster";
import { AuthProvider } from "./context/AuthProvider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navbarRoutes = ["/", "/pages/login", "/pages/register"];
  const showNavbar = navbarRoutes.includes(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AuthProvider>
        {showNavbar ? (
          <main className="w-full">
            <Navbar />
            <Toaster />
            {children}
          </main>
        ) : (
          <>
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <main className="flex-1 bg-background">{children}</main>
            <Toaster />
          </>
        )}
      </AuthProvider>
    </div>
  );
}
