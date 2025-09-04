"use client";

import React, { forwardRef, useMemo, useState } from "react";

type Size = "sm" | "md" | "lg";

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  size?: Size;
  checked?: boolean; // controlado
  defaultChecked?: boolean; // no controlado
  onCheckedChange?: (checked: boolean) => void;
  name?: string; // si quieres enviar en formularios
  value?: string;
}

function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const trackSize: Record<Size, string> = {
  sm: "w-9 h-5",
  md: "w-11 h-6",
  lg: "w-14 h-7",
};

const knobSize: Record<Size, string> = {
  sm: "after:h-4 after:w-4 after:top-0.5 after:left-[2px]",
  md: "after:h-5 after:w-5 after:top-0.5 after:left-[2px]",
  lg: "after:h-6 after:w-6 after:top-0.5 after:left-[2px]",
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle(
    {
      size = "md",
      checked,
      defaultChecked,
      onCheckedChange,
      className,
      name,
      value,
      disabled,
      ...props
    },
    ref
  ) {
    const isControlled = useMemo(() => checked !== undefined, [checked]);
    const [internal, setInternal] = useState(Boolean(defaultChecked));
    const isOn = isControlled ? Boolean(checked) : internal;

    const toggle = () => {
      if (disabled) return;
      const next = !isOn;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    return (
      <span className="inline-flex items-center">
        {/* input hidden solo si quieres que forme parte del submit */}
        {name && (
          <input type="hidden" name={name} value={isOn ? value ?? "on" : ""} />
        )}

        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          onClick={toggle}
          // ...dentro del className del <button>:
          className={cn(
            "relative rounded-full transition-colors select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
            trackSize[size],
            // track (contenedor)
            isOn ? "bg-[rgb(var(--accent))]" : "bg-[rgb(var(--surface-muted))]",
            "border border-gray-500 dark:border-[rgb(var(--border))]",
            disabled && "opacity-10 cursor-not-allowed",

            // knob
            "after:content-[''] after:absolute",
            knobSize[size],
            "after:rounded-full after:transition-transform",
            "after:bg-[rgb(var(--surface))] after:border-2 after:border-black",
            isOn ? "after:translate-x-full" : "after:translate-x-0",
            className
          )}
          {...props}
        />
      </span>
    );
  }
);
