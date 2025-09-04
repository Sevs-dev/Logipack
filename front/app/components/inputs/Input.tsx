"use client";

import React, { forwardRef } from "react";

type Tone = "default" | "strong" | "success" | "danger" | "warning" | "info";
type Size = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  tone?: Tone; // default=usa --input, strong=usa --border
  size?: Size; // paddings y font-size
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const toneToBorderVar: Record<Tone, string> = {
  default: "var(--input)",
  strong: "var(--border)",
  success: "var(--success)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  info: "var(--info)",
};

const sizeToPadding: Record<Size, string> = {
  sm: "h-9 text-sm",
  md: "h-10 text-base",
  lg: "h-11 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    tone = "default",
    size = "md",
    leftIcon,
    rightIcon,
    className,
    containerClassName,
    disabled,
    ...props
  },
  ref
) {
  // Forzamos el color de borde con `!` para ganarle a reglas base
  const borderClass = `!border-[rgb(${toneToBorderVar[tone]})]`;
  const ringClass =
    tone === "default" || tone === "strong"
      ? "focus:ring-[rgb(var(--ring))]"
      : `focus:ring-[rgb(${toneToBorderVar[tone]})]`;

  const hasLeft = Boolean(leftIcon);
  const hasRight = Boolean(rightIcon);

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-[rgb(var(--foreground))]">
          {label}
        </label>
      )}

      <div className="relative">
        {hasLeft && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            // base
            "w-full rounded-md border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]",
            "placeholder:text-[rgb(var(--muted-foreground))]/70",
            "focus:outline-none focus:ring-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // tokens
            borderClass,
            ringClass,
            // size
            sizeToPadding[size],
            hasLeft ? "pl-10 pr-3" : hasRight ? "pl-3 pr-10" : "px-3",
            // opcional: text-center como tenías
            "text-center",
            className
          )}
          {...props}
        />

        {hasRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </span>
        )}
      </div>

      {hint && (
        <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
          {hint}
        </p>
      )}
    </div>
  );
});
