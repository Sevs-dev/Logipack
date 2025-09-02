"use client";
import Card from "./Card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  PieLabelRenderProps,
} from "recharts";
import { COLORS } from "./helpers";

export type PieDatum = { name: string; value: number };

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  value,
}: PieLabelRenderProps & { name?: string; value?: number }) => {
  if (!value) return null;
  const RAD = Math.PI / 180;
  const radius = Number(outerRadius) * 1.15;
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RAD);
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RAD);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      fontSize={11}
      fontWeight={600}
      textAnchor={x > Number(cx) ? "start" : "end"}
      dominantBaseline="central"
      className="drop-shadow text-foreground"
    >
      {`${name}: ${value} (${(percent! * 100).toFixed(0)}%)`}
    </text>
  );
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; value: number; percent: number } }[];
}) {
  if (active && payload && payload.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="bg-background/80 border border-foreground/10 rounded-xl px-3 py-2 text-foreground text-xs shadow-lg backdrop-blur">
        <b>{name}</b>
        <br />
        {value} órdenes
        <br />
        {Math.round(percent * 100)}%
      </div>
    );
  }
  return null;
}

export default function StatesPie({ data }: { data: PieDatum[] }) {
  const allZero = data.every((d) => d.value === 0);

  return (
    <Card>
      <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold mb-4 text-center tracking-wider flex items-center justify-center gap-2 drop-shadow-sm text-foreground">
        <span className="text-2xl sm:text-3xl md:text-4xl animate-pulse">📊</span>
        <span className="drop-shadow">Distribución de Estados</span>
      </h2>

      <div className="w-full flex flex-col items-center min-h-[260px]">
        {allZero ? (
          <div className="flex flex-col items-center py-12 opacity-70 select-none">
            <span className="text-5xl sm:text-6xl mb-3 animate-bounce">🤷‍♂️</span>
            <span className="text-base sm:text-lg text-foreground/80 font-medium">
              No hay datos para mostrar.
            </span>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart /* El stroke usa currentColor (tema) */ className="text-foreground/30">
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={renderCustomLabel}
                  isAnimationActive
                  animationDuration={800}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value > 0 ? COLORS[i % COLORS.length] : "transparent"}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  // Cursor temeable (requiere soporte de color-mix; si no, cámbialo por un rgba fijo)
                  cursor={{ fill: "color-mix(in oklab, rgb(var(--foreground)) 20%, transparent)" }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {data.map(
                (entry, i) =>
                  entry.value > 0 && (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs text-foreground/80 font-medium">
                        {entry.name}
                      </span>
                    </div>
                  )
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
