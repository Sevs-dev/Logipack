// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import ClientLayout from "./ClientLayout";

export default function RootLayout({ children }: { children: ReactNode }) {
  // IIFE que corre ANTES de hidratar: default = "dark" si no hay nada guardado.
  const themeInit = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    var root = document.documentElement;
    // data-theme para tus variables CSS
    root.dataset.theme = theme;
    // Clase .dark para Tailwind
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    // Para componentes nativos que respetan el esquema
    root.style.colorScheme = theme;
  } catch (e) {}
})();
  `;

  return (
    // Primer paint en oscuro (sin usar "any")
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        {/* Corre lo antes posible para fijar tema antes de pintar */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* (Opcional) Informa que soportas ambos esquemas */}
        <meta name="color-scheme" content="dark light" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
