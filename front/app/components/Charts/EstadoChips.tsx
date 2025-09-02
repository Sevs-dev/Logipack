"use client";

type EstadoChipsProps = {
  estados: string[];
  selected: string;
  labels: Record<string, string>;
  onSelect: (v: string) => void;
};

export default function EstadoChips({
  estados,
  selected,
  labels,
  onSelect,
}: EstadoChipsProps) {
  const base =
    "px-4 py-1 rounded-full font-semibold border capitalize transition-colors";

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center justify-center">
      <button
        onClick={() => onSelect("todos")}
        className={
          base +
          " " +
          (selected === "todos"
            ? "bg-cyan-400 text-black shadow"
            : "bg-background/40 text-foreground border-foreground/20 hover:bg-foreground/10")
        }
      >
        Todos
      </button>

      {estados.map((est) => (
        <button
          key={est}
          onClick={() => onSelect(est)}
          className={
            base +
            " " +
            (selected === est
              ? "bg-cyan-400 text-black shadow"
              : "bg-background/40 text-foreground border-foreground/20 hover:bg-foreground/10")
          }
        >
          {labels[est] ?? est}
        </button>
      ))}
    </div>
  );
}
