import type { Metadata } from "next";
import Navbar from "./components/navbar/Navbar";
import "./globals.css";
export const metadata: Metadata = {
  title: "Logipack",
  description: "",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
      <Navbar />
        {children}
      </body>
    </html>
  );
}

