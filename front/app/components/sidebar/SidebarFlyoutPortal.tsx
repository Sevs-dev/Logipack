import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";

export default function SidebarFlyoutPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
