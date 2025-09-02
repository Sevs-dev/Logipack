"use client";
import { Planning } from "./types";
import { estadoLabels, normalizeKey } from "./helpers";

type OrdersTableProps = {
  items: Planning[];
  onEjecucion: (p: Planning) => void;
  onActividades: (p: Planning) => void;
  tituloSufijo?: string; // "En Ejecución", etc.
};

export default function OrdersTable({
  items,
  onEjecucion,
  onActividades,
  tituloSufijo,
}: OrdersTableProps) {
  return (
    <section className="backdrop-blur-md bg-background/40 border border-foreground/10 p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-center text-foreground">
        📋 Órdenes {tituloSufijo ?? ""}
        <span className="ml-2 text-foreground/60 font-normal text-sm">
          (Totales: {items.length})
        </span>
      </h2>

      <div
        className="overflow-auto max-h-[420px] rounded-2xl shadow-inner border border-foreground/10"
        style={{
          scrollbarColor: "rgb(var(--foreground)) rgb(var(--background))",
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          /* Scrollbar WebKit temeable */
          div::-webkit-scrollbar { width: 10px; background: rgb(var(--background)); border-radius: 12px; }
          div::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #10b981 0%, #22d3ee 100%); /* emerald → cyan */
            border-radius: 12px; min-height: 48px;
            border: 2px solid rgb(var(--background));
            box-shadow: 0 1px 8px rgba(0,0,0,.25);
            transition: background .2s ease;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #22d3ee 0%, #10b981 100%);
          }
          div::-webkit-scrollbar-track,
          div::-webkit-scrollbar-corner { background: rgb(var(--background)); }
        `}</style>

        <table className="min-w-full text-xs md:text-sm border-separate">
          <thead className="sticky top-0 z-10">
            <tr>
              {["N° Orden", "Estado", "Cliente", "Fecha Creación", "Fecha Fin"].map((th, i, arr) => (
                <th
                  key={th}
                  className="px-4 py-2 font-semibold text-center tracking-wide text-foreground border-b border-foreground/20"
                  style={{
                    background:
                      "linear-gradient(to right, color-mix(in oklab, rgb(var(--foreground)) 6%, transparent), color-mix(in oklab, rgb(var(--foreground)) 10%, transparent), color-mix(in oklab, rgb(var(--foreground)) 6%, transparent))",
                    borderTopLeftRadius: i === 0 ? "0.75rem" : undefined,
                    borderTopRightRadius: i === arr.length - 1 ? "0.75rem" : undefined,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item, idx) => {
              const norm = normalizeKey(item.status_dates ?? "Sin Estado");
              const isEjec = norm === "en_ejecucion";
              const isEjecutado = norm === "ejecutado";

              // Paleta nueva: emerald (ejecutado), sky (planificación), amber (creación), fuchsia (en ejecución), slate (default)
              const statusClass =
                norm === "ejecutado"
                  ? "bg-emerald-500/65 text-emerald-950 dark:bg-emerald-500/22 dark:text-emerald-200 border border-emerald-600/45 dark:border-emerald-400/25 ring-1 ring-emerald-400/35 dark:ring-emerald-300/20"
                  : norm === "planificacion"
                  ? "bg-sky-500/65 text-sky-950 dark:bg-sky-500/22 dark:text-sky-200 border border-sky-600/45 dark:border-sky-400/25 ring-1 ring-sky-400/35 dark:ring-sky-300/20"
                  : norm === "creacion"
                  ? "bg-amber-400/70 text-amber-950 dark:bg-amber-400/22 dark:text-amber-200 border border-amber-600/45 dark:border-amber-300/25 ring-1 ring-amber-400/35 dark:ring-amber-300/20"
                  : norm === "en_ejecucion"
                  ? "bg-fuchsia-600/65 text-fuchsia-950 dark:bg-fuchsia-600/22 dark:text-fuchsia-200 border border-fuchsia-500/45 dark:border-fuchsia-400/25 ring-1 ring-fuchsia-400/35 dark:ring-fuchsia-300/20 cursor-pointer hover:bg-fuchsia-700/75 dark:hover:bg-fuchsia-700/35 hover:scale-[1.03]"
                  : "bg-foreground/[0.18] text-foreground/90 dark:bg-foreground/10 dark:text-foreground/65 border border-foreground/25 dark:border-foreground/20";

              return (
                <tr
                  key={item.id}
                  className={[
                    "rounded-xl transition-colors",
                    idx % 2 === 0 ? "bg-background/5" : "bg-background/10",
                    "hover:bg-foreground/8",
                  ].join(" ")}
                >
                  <td className="px-4 py-2 text-center font-mono font-bold text-foreground border border-foreground/10">
                    {item.number_order}
                  </td>

                  <td className="px-4 py-2 text-center border border-foreground/10">
                    <span
                      className={`inline-block px-3.5 py-1.5 rounded-full text-[0.70rem] md:text-xs font-semibold transition-colors ${statusClass}`}
                      style={{ userSelect: "none", transition: "transform .15s ease" }}
                      onClick={() => {
                        if (isEjec) onEjecucion(item);
                        if (isEjecutado) onActividades(item);
                      }}
                      title={isEjec ? "Ir a ejecución" : isEjecutado ? "Ver actividades" : undefined}
                      role={isEjec || isEjecutado ? "button" : undefined}
                      tabIndex={isEjec || isEjecutado ? 0 : undefined}
                    >
                      {estadoLabels[norm] ?? item.status_dates}
                      {isEjec && <span className="ml-2 animate-pulse">🚀</span>}
                    </span>
                  </td>

                  <td className="px-4 py-2 text-center font-semibold text-foreground/90 border border-foreground/10">
                    {item.client?.name ?? item.client_id}
                  </td>

                  <td className="px-4 py-2 text-center text-xs text-foreground/70 border border-foreground/10">
                    {item.created_at?.slice(0, 16)}
                  </td>

                  <td className="px-4 py-2 text-center text-xs text-foreground/70 border border-foreground/10">
                    {item.end_date?.slice(0, 16) || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
