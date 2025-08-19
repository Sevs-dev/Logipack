import { useEffect, useState, useCallback, useMemo } from "react";
import { actividades_ejecutadas } from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";
import Mini from "../loader/MiniLoader";
import Image from "next/image";

// Tipos mínimos necesarios basados en lo que usas en el render
interface Orden {
  number_order?: string;
  cliente?: string;
  planta?: string;
  descripcion_maestra?: string;
}

interface ActividadItem {
  id: number;
  description_fase: string;
  phase_type: string;
  linea: string;
  user: string;
  estado_form: string; // "1" | "0"
  forms: string; // JSON string
}

interface FormItem {
  id_activitie: number | string;
  descripcion_activitie: string;
  clave: string;
  valor?: string; // puede ser texto o dataURL
  config?: unknown; // luego lo parseamos para extraer "type"
}

type ConfigParsed = { type?: string } | Record<string, unknown>;

const safeParseForms = (forms: string): FormItem[] => {
  try {
    const first = JSON.parse(forms);
    if (typeof first === "string") {
      return JSON.parse(first) as FormItem[];
    }
    return first as FormItem[];
  } catch {
    return [];
  }
};

const safeParseConfig = (config: unknown): ConfigParsed => {
  try {
    if (typeof config === "string") {
      const first = JSON.parse(config);
      if (typeof first === "string") {
        return JSON.parse(first);
      }
      return first;
    }
    if (typeof config === "object" && config) return config as ConfigParsed;
  } catch {
    /* ignore */
  }
  return {};
};

const NewDetalle = () => {
  const params = useParams<{ id?: string | string[] }>();

  // Normaliza el id (string|string[] -> string|undefined)
  const idParam = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  // A número (o NaN si no aplica)
  const orderId = useMemo(() => Number(idParam), [idParam]);

  const [orden, setOrden] = useState<Orden | null>(null);
  const [actividades, setActividades] = useState<ActividadItem[]>([]);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  // obtener actividades
  const obtenerActividades = useCallback(async () => {
    if (!Number.isFinite(orderId)) return;
    try {
      const data = await actividades_ejecutadas(orderId);
      if (data?.actividades) {
        setOrden(data.orden as Orden);
        setActividades(data.actividades as ActividadItem[]);
      }
    } catch (error) {
      console.error("Error al obtener fases:", error);
    }
  }, [orderId]);

  // disparo carga
  useEffect(() => {
    obtenerActividades();
  }, [obtenerActividades]);

  // si no hay actividades
  if (actividades.length < 1) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span>No hay actividades finalizadas para mostrar.</span>
          <Mini />
        </div>
      </div>
    );
  }

  // si hay actividades
  return (
    <div className="min-h-screen w-full bg-gray-950 text-white p-4 sm:p-6 flex flex-col rounded-2xl">
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          {imagenAmpliada && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
              onClick={() => setImagenAmpliada(null)}
            >
              <Image
                src={imagenAmpliada}
                alt="Vista ampliada"
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] w-auto h-auto rounded-lg shadow-2xl border border-white/20"
                unoptimized
              />
              <button
                className="absolute top-4 right-4 text-white text-xl font-bold"
                onClick={() => setImagenAmpliada(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/80">
            <h3 className="text-2xl font-bold text-white">
              Información de Actividades
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Información de la Orden */}
            <div className="w-full rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg p-4 text-white/80 font-medium text-lg">
              <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-s gap-6 text-sm text-gray-200">
                <div>
                  <p className="text-gray-500 text-center">Orden N°</p>
                  <p className="font-medium text-gray-200 text-center">
                    {orden?.number_order}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-center">Cliente</p>
                  <p className="font-medium text-gray-200 text-center">
                    {orden?.cliente}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-center">Planta</p>
                  <p className="font-medium text-gray-200 text-center">
                    {orden?.planta}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-center">Maestra</p>
                  <p className="font-medium text-gray-200 text-center">
                    {orden?.descripcion_maestra}
                  </p>
                </div>
              </div>
            </div>

            {/* Fase */}
            <div className="w-full rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <h3 className="text-xl font-semibold text-white">
                  Detalle de Actividades
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {actividades.map(
                    ({
                      id,
                      description_fase,
                      phase_type,
                      linea,
                      user,
                      estado_form,
                      forms,
                    }) => {
                      const lista: FormItem[] = safeParseForms(forms);
                      return (
                        <div
                          key={id}
                          className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 shadow-lg transition hover:shadow-xl hover:bg-gray-800/60"
                        >
                          <div className="mb-4 space-y-1">
                            <h4 className="text-lg font-semibold text-white">
                              {description_fase}
                            </h4>
                            <div className="flex justify-between text-sm text-white/60">
                              <span className="italic">
                                {phase_type}
                                <br /> Estado :{" "}
                                {estado_form === "1"
                                  ? "Finalizado"
                                  : "En ejecución"}
                              </span>
                              <span>
                                {user} <br /> Linea: {linea}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {lista.map((item, index: number) => {
                              const config = safeParseConfig(item.config) as {
                                type?: string;
                              };
                              const { type } = config;
                              const isMedia =
                                (type === "signature" ||
                                  type === "img" ||
                                  type === "image" ||
                                  type === "file") &&
                                typeof item.valor === "string" &&
                                item.valor.startsWith("data:");

                              return (
                                <div
                                  key={item.id_activitie}
                                  className="space-y-2 border-l-4 border-indigo-500 pl-4"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/20 text-indigo-300 font-bold rounded-lg">
                                      {item.id_activitie}
                                    </div>

                                    <div className="flex-1">
                                      <h5 className="text-white font-medium">
                                        {item.descripcion_activitie}
                                      </h5>

                                      <div className="grid grid-cols-1 gap-1 text-sm mt-2">
                                        {/* Clave */}
                                        <div>
                                          <span className="text-white/60">
                                            Clave:
                                          </span>
                                          <span className="ml-2 text-white/80 font-mono">
                                            {item.clave}
                                          </span>
                                        </div>

                                        {/* Valor */}
                                        <div>
                                          <span className="text-white/60">
                                            Valor:
                                          </span>
                                          <div className="ml-2 mt-1">
                                            {isMedia ? (
                                              <div className="flex justify-start">
                                                <Image
                                                  src={item.valor as string}
                                                  alt="Vista previa"
                                                  width={400}
                                                  height={176} // ~max-h-44
                                                  className="rounded-lg border border-gray-700 shadow-lg max-h-44 object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105"
                                                  unoptimized
                                                  onClick={() =>
                                                    setImagenAmpliada(
                                                      item.valor as string
                                                    )
                                                  }
                                                />
                                              </div>
                                            ) : (
                                              <span className="text-white/80 font-medium break-words">
                                                {item.valor as string}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Tipo */}
                                        {type && (
                                          <div className="mt-2 text-xs">
                                            <span className="inline-block bg-gray-700/40 px-2 py-1 rounded text-white/60">
                                              Tipo: {JSON.stringify(type)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  {index < lista.length - 1 && (
                                    <div className="border-b border-gray-700/30 my-4" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDetalle;
