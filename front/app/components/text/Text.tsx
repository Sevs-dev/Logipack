import React, { type ReactNode, type CSSProperties } from "react";

type HeadingType = "title" | "subtitle" | "error" | "alert";

/** Clases Tailwind válidas para color de texto (incluye arbitrary y !important) */
type TailwindTextClass =
  | `text-${string}`
  | `!text-${string}`
  | `text-[${string}]`
  | `!text-[${string}]`;

/** Colores CSS típicos */
type CssColor =
  | `#${string}`
  | `rgb(${string})`
  | `rgba(${string})`
  | `hsl(${string})`
  | `hsla(${string})`
  | `var(${string})`;

type ColorInput = TailwindTextClass | CssColor;

interface HeadingProps {
  children: ReactNode;
  type?: HeadingType;
  /** Acepta clases Tailwind (`text-...`) o color CSS (`#...`, `rgb(...)`, `var(...)`) */
  color?: ColorInput;
}

function isCssColor(c?: string): c is CssColor {
  return !!c && (/^#|^rgb\(|^rgba\(|^hsl\(|^hsla\(|^var\(/i.test(c));
}

function isTextClass(c?: string): c is TailwindTextClass {
  return !!c && /^!?text-/.test(c);
}

function borderClassFromText(c: TailwindTextClass): string {
  // conserva el ! si existe y transforma text-* -> border-*
  if (c.startsWith("!text-")) return `!border-${c.slice("!text-".length)}`;
  if (c.startsWith("text-")) return `border-${c.slice("text-".length)}`;
  // arbitrary: text-[...]
  if (c.startsWith("!text-[")) return `!border-[${c.slice("!text-[".length, -1)}]`;
  if (c.startsWith("text-[")) return `border-[${c.slice("text-[".length, -1)}]`;
  return "border-[rgb(var(--foreground))]";
}

const Heading: React.FC<HeadingProps> = ({ children, type = "title", color }) => {
  // Color de texto: clase si es Tailwind; estilo inline si es color CSS
  const textColorClass = isTextClass(color) ? color : undefined;
  const textStyle: CSSProperties | undefined = isCssColor(color)
    ? { color: color as string }
    : undefined;

  // Defaults por tipo usando tokens del tema
  const baseTitle = "text-2xl font-bold text-[rgb(var(--foreground))]";
  const baseSubtitle = "text-sm font-semibold text-[rgb(var(--foreground))]/80";
  const baseError = "text-sm font-semibold text-[rgb(var(--danger))]";
  const baseAlert = "text-sm font-semibold text-[rgb(var(--warning))]";

  const applyColor = (base: string) => (textColorClass ? `${base} ${textColorClass}` : base);

  let headingNode: JSX.Element;
  switch (type) {
    case "subtitle":
      headingNode = (
        <h2 className={applyColor(baseSubtitle)} style={textStyle}>
          {children}
        </h2>
      );
      break;
    case "error":
      headingNode = (
        <h3 className={applyColor(baseError)} style={textStyle}>
          {children}
        </h3>
      );
      break;
    case "alert":
      headingNode = (
        <h3 className={applyColor(baseAlert)} style={textStyle}>
          {children}
        </h3>
      );
      break;
    case "title":
    default:
      headingNode = (
        <h1 className={applyColor(baseTitle)} style={textStyle}>
          {children}
        </h1>
      );
  }

  // Borde inferior: si pasas color CSS, lo uso; si pasas clase Tailwind, la convierto a border-*
  const borderClass =
    isTextClass(color)
      ? borderClassFromText(color)
      : type === "error"
      ? "border-[rgb(var(--danger))]"
      : type === "alert"
      ? "border-[rgb(var(--warning))]"
      : type === "subtitle"
      ? "border-[rgb(var(--border))]"
      : "border-[rgb(var(--foreground))]";

  const borderStyle: CSSProperties | undefined = isCssColor(color)
    ? { borderColor: color as string }
    : undefined;

  return (
    <div className="text-center w-full">
      {headingNode}
      <hr
        className={`mt-2 w-full sm:max-w-[260px] mx-auto mb-2 transition-colors duration-200 border ${!isCssColor(color) ? borderClass : ""}`}
        style={borderStyle}
      />
    </div>
  );
};

export default Heading;
