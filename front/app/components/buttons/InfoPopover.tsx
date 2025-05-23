import { useEffect, useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface InfoPopoverProps {
  content: ReactNode;
}

export function InfoPopover({ content }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    setIsTouch(isTouchDevice);
  }, []);

  const handleMouseEnter = () => {
    if (isTouch) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleClick = () => {
    if (!isTouch) return;
    setOpen(prev => !prev);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="text-blue-600 hover:text-blue-800 transition p-1 rounded-full cursor-pointer">
        <Info className="w-5 h-5" aria-label="Info" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="popover"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 mt-2 w-64 p-3 text-sm text-gray-700 bg-white border rounded-lg shadow-xl"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
