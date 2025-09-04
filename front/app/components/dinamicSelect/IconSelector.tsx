'use client";' 
import {
  Smile, Heart, Star, Sun, Moon, Camera, Bell, Coffee, ThumbsUp, Trash,
  Music, Zap, AlertCircle, Calendar, Cloud, Folder, Globe, Lock, Phone
} from "lucide-react";

const iconOptions = [
  { name: "Smile", icon: Smile },
  { name: "Heart", icon: Heart },
  { name: "Star", icon: Star },
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Camera", icon: Camera },
  { name: "Bell", icon: Bell },
  { name: "Coffee", icon: Coffee },
  { name: "ThumbsUp", icon: ThumbsUp },
  { name: "Trash", icon: Trash },
  { name: "Music", icon: Music },
  { name: "Zap", icon: Zap },
  { name: "AlertCircle", icon: AlertCircle },
  { name: "Calendar", icon: Calendar },
  { name: "Cloud", icon: Cloud },
  { name: "Folder", icon: Folder },
  { name: "Globe", icon: Globe },
  { name: "Lock", icon: Lock },
  { name: "Phone", icon: Phone },
];

export function IconSelector({
  onChange,
  selectedIcon,
}: {
  onChange: (icon: string) => void;
  selectedIcon: string;
}) {
  return (
    <div
  className="flex gap-4 flex-wrap dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]"
  role="radiogroup"
  aria-label="Seleccionar ícono"
>
  {iconOptions.map(({ name, icon: IconComponent }) => {
    const isSelected = selectedIcon === name;
    return (
      <button
        key={name}
        type="button"
        role="radio"
        aria-checked={isSelected}
        title={name}
        onClick={() => onChange(name)}
        className={[
          "group relative p-2 rounded-xl transition outline-none",
          "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
          "hover:bg-[rgb(var(--surface-muted))]",
          "focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))]",
          // 👇 Estado seleccionado bien notorio (bg, borde, anillo y color del icono)
          isSelected
            ? "bg-[rgb(var(--accent))]/10 border-[rgb(var(--accent))] ring-2 ring-[rgb(var(--ring))] ring-offset-2 ring-offset-[rgb(var(--surface))] text-[rgb(var(--accent))]"
            : "",
          // Fallbacks dark
          "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
          // Asegurar que el SVG herede color y stroke
          "[&_svg]:w-6 [&_svg]:h-6 [&_svg]:stroke-current [&_svg]:text-current",
        ].join(" ")}
      >
        <IconComponent />
        {isSelected && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgb(var(--accent))] text-white text-[10px] font-bold shadow">
            ✓
          </span>
        )}
      </button>
    );
  })}
</div>

  );
}
