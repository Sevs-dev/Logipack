import { useEffect, useState, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface InfoPopoverProps {
  content: ReactNode;
}

export function InfoPopover({ content }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(hover: none)").matches;
    setIsTouch(isTouchDevice);
  }, []);

  const handleMouseEnter = () => {
    if (isTouch) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePopoverPosition();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleClick = () => {
    if (!isTouch) return;
    updatePopoverPosition();
    setOpen((prev) => !prev);
  };

  const updatePopoverPosition = () => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const popoverWidth = 256; // w-64 = 256px
    const padding = 8;

    if (triggerRect) {
      let left = triggerRect.left + window.scrollX;
      const top = triggerRect.bottom + window.scrollY + padding;

      const rightEdge = left + popoverWidth;
      const viewportWidth = window.innerWidth;

      if (rightEdge > viewportWidth) {
        left = viewportWidth - popoverWidth - padding;
      }

      if (left < padding) left = padding;

      setPosition({ top, left });
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      ref={triggerRef}
    >
      <div className="text-blue-600 hover:text-blue-800 transition p-1 rounded-full cursor-pointer">
        <Info className="w-5 h-5" aria-label="Info" />
      </div>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="popover"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="fixed z-[9999] w-64 p-3 text-sm text-gray-700 bg-white border rounded-lg shadow-xl text-center"
                style={{
                  top: position.top,
                  left: position.left,
                }}
                ref={popoverRef}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
