"use client";
import CountUp from "react-countup";
import { KPIItem } from "./types";

type KPIGridProps = {
  kpis: KPIItem[];
  extra?: { label: string; value: number; sub: string; accentClass: string };
};

export default function KPIGrid({ kpis, extra }: KPIGridProps) {
  const card =
    "backdrop-blur-md bg-background/40 border border-foreground/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300";
  const title =
    "text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2";
  const sub = "text-xs text-foreground/60 mt-2";

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 text-center">
      {kpis.map(({ label, color, icon, value }) => (
        <div key={label} className={card}>
          <h2 className={title}>
            {icon} {label}
          </h2>
          <p className={`text-2xl sm:text-3xl font-bold ${color}`}>
            <CountUp end={value} duration={2} />
          </p>
          <p className={sub}>Datos Actualizados</p>
        </div>
      ))}

      {extra && (
        <div className={card}>
          <h2 className={title}>📅 {extra.label}</h2>
          <p className={`text-2xl sm:text-3xl font-bold ${extra.accentClass}`}>
            <CountUp end={extra.value} duration={2} />
          </p>
          <p className={sub}>{extra.sub}</p>
        </div>
      )}
    </section>
  );
}
