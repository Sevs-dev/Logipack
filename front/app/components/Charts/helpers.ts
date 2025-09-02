export const emojis = [
  "🤖",
  "🗂️",
  "🎯",
  "📎",
  "🔧",
  "🕒",
  "🧾",
  "🛠️",
  "📬",
  "👥",
  "💬",
  "🪙",
  "😎",
  "🚀",
  "🔥",
  "🤓",
  "💻",
  "🧃",
  "🎉",
  "🧠",
  "👀",
  "💬",
  "🙌",
  "🐱‍👤",
  "⚡",
  "🥳",
  "🪄",
  "🛠️",
  "🧩",
  "👾",
  "🧘",
  "📦",
  "📈",
  "🧑‍💼",
  "💼",
  "🏢",
  "📊",
  "💡",
  "🔒",
];

export const COLORS = [
  "#FACC15",
  "#22d3ee",
  "#4ade80",
  "#a78bfa",
  "#f472b6",
  "#fb7185",
  "#6ee7b7",
  "#fcd34d",
];

// Normalizador robusto de estado
export const normalizeKey = (key: string) => {
  const norm = key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/^en_/, "");

  if (["creacion", "en_creacion", "encreacion"].includes(norm))
    return "creacion";
  if (["planificacion", "en_planificacion"].includes(norm))
    return "planificacion";
  if (["ejecutado", "ejecutada"].includes(norm)) return "ejecutado";
  if (["en_ejecucion", "ejecucion"].includes(norm)) return "en_ejecucion";
  return norm;
};

export const estadoLabels: Record<string, string> = {
  creacion: "En Creación",
  planificacion: "Planificación",
  ejecutado: "Ejecutadas",
  en_ejecucion: "En Ejecución",
};

export const ALL_ESTADOS = Object.keys(estadoLabels);
