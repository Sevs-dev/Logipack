"use client";
import Card from "./Card";
import { motion } from "framer-motion";

type TopClientsProps = {
  topClientes: Array<[string, number]>;
};

export default function TopClients({ topClientes }: TopClientsProps) {
  return (
    <Card>
      <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 text-center tracking-wide flex items-center justify-center gap-2 text-foreground">
        <span className="text-xl sm:text-2xl">🏆</span> Top 5 Clientes
      </h2>

      <ol className="space-y-2 sm:space-y-3">
        {topClientes.length === 0 ? (
          <div className="flex flex-col items-center py-12 opacity-70">
            <span className="text-4xl sm:text-5xl mb-2 animate-bounce">🤷‍♂️</span>
            <span className="text-sm sm:text-base text-foreground/80">
              Sin clientes destacados.
            </span>
          </div>
        ) : (
          topClientes.map(([clienteName, cantidad], idx) => (
            <motion.li
              key={clienteName}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={[
                "flex items-center justify-between px-3 sm:px-4 py-2 rounded-xl shadow-sm",
                // Gradiente temeable con toque de color según ranking
                idx === 0
                  ? "bg-gradient-to-r from-[color:rgb(251_191_36_/_0.30)] via-background/0 to-background/0" // amber-400/30
                  : idx === 1
                  ? "bg-gradient-to-r from-[color:rgb(212_212_212_/_0.20)] via-background/0 to-background/0" // zinc-300/20
                  : idx === 2
                  ? "bg-gradient-to-r from-[color:rgb(180_83_9_/_0.30)] via-background/0 to-background/0" // amber-800/30
                  : "bg-background/0",
              ].join(" ")}
            >
              <span className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                {["🥇", "🥈", "🥉"][idx] || (
                  <span className="text-foreground/50">#{idx + 1}</span>
                )}
                <span className="ml-2">{clienteName}</span>
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[color:rgb(16_185_129)] drop-shadow-sm">
                {cantidad}
              </span>
            </motion.li>
          ))
        )}
      </ol>
    </Card>
  );
}
