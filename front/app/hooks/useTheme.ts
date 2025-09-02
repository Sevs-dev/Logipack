"use client";

import { useCallback, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

// Lee el tema inicial en el cliente. Si no hay nada guardado → dark.
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  // Si quieres respetar el sistema, podrías usar:
  // const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  // return prefersDark ? "dark" : "dark"; // <- en tu caso: siempre dark
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Aplica tema a <html>
  const apply = useCallback((t: Theme) => {
    const root = document.documentElement;
    // Para variables CSS por data-theme (tu caso actual)
    root.dataset.theme = t;
    // Para Tailwind `dark:` (si lo usas)
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    // Para componentes nativos que respetan color-scheme
    root.style.colorScheme = t;

    localStorage.setItem("theme", t);
    setTheme(t);
  }, []);

  // Toggle
  const toggleTheme = useCallback(() => {
    apply(theme === "light" ? "dark" : "light");
  }, [theme, apply]);

  // Al montar: asegura que el DOM tenga el tema correcto SIN parpadeo
  useLayoutEffect(() => {
    apply(getInitialTheme());
  }, [apply]);

  return { theme, toggleTheme };
}
