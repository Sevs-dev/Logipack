// app/layout.tsx
import "./globals.css"; // Asegúrate de importar tus estilos globales
import { ReactNode } from "react";
import ClientLayout from "./ClientLayout";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en"> 
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

