import { useEffect, useState, useCallback } from "react";
// import "tailwindcss/tailwind.css";
import { actividades_ejecutadas } from "@/app/services/planing/planingServices";

const NewDetalle = () => {
  const [orden, setOrden] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);


  // obtener actividades
  const obtenerActividades = useCallback(async () => {
    try {
      const data = await actividades_ejecutadas(27);
      console.log(data);
      if (data?.actividades) {
        setOrden(data.orden);
        setActividades(data.actividades);
      }
    } catch (error) {
      console.error('Error al obtener fases:', error);
    }
  }, []);

  // obtener actividades
  useEffect(() => {
    obtenerActividades();
  }, [obtenerActividades]);

  // si no hay actividades
  if (!actividades.length) {
    return <div className="text-white">Cargando...</div>;
  }

  // si hay actividades
  return (
    <div className="min-h-screen w-full bg-gray-950 text-white p-4 sm:p-6 flex flex-col rounded-2xl">
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">

          {imagenAmpliada && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
              onClick={() => setImagenAmpliada(null)}>
              <img
                src={imagenAmpliada}
                alt="Vista ampliada"
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/20"
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
            <h3 className="text-2xl font-bold text-white">Información de Actividades</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Información de la Orden */}
            <div className="w-full rounded-xl bg-white/5 backdrop-blur-md border border-white/10 
              shadow-lg p-4 text-white/80 font-medium text-lg">
              <div
                className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 
          md:grid-cols-3 lg:grid-cols-s gap-6 text-sm text-gray-200"
              >
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
                {/* <div>
                  <p className="text-gray-500 text-center">Línea</p>
                  <p className="font-medium text-gray-200 text-center">
                    {data?.linea} ({data?.local.descripcion})
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-center">Cantidad a producir</p>
                  <p className="font-medium text-gray-200 text-center">
                    {data?.orden?.cantidad_producir}
                  </p>
                </div> */}
              </div>






            </div>

            {/* Fase */}
            <div className="w-full rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <h3 className="text-xl font-semibold text-white">Detalle de Actividades</h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {actividades.map(({ id, description_fase, phase_type, linea, user, estado_form, forms }) => {
                    const lista = JSON.parse(forms);
                    return (
                      <div
                        key={id}
                        className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 shadow-lg transition hover:shadow-xl hover:bg-gray-800/60"
                      >
                        <div className="mb-4 space-y-1">
                          <h4 className="text-lg font-semibold text-white">{description_fase}</h4>
                          <div className="flex justify-between text-sm text-white/60">
                            <span className="italic">{phase_type}
                              <br /> Estado : {estado_form == "1" ? "Finalizado" : "En ejecución"}
                            </span>
                            <span>{user} <br /> Linea: {linea}</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {lista.map((item: any, index: any) => {
                            let config = item.config;
                            try {
                              if (typeof config === "string") config = JSON.parse(config);
                              if (typeof config === "string") config = JSON.parse(config);
                            } catch {
                              config = {};
                            }
                            const { type } = config;

                            return (
                              <div key={item.id_activitie} className="space-y-2 border-l-4 border-indigo-500 pl-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/20 text-indigo-300 font-bold rounded-lg">
                                    {item.id_activitie}
                                  </div>

                                  <div className="flex-1">
                                    <h5 className="text-white font-medium">{item.descripcion_activitie}</h5>

                                    <div className="grid grid-cols-1 gap-1 text-sm mt-2">
                                      {/* Clave */}
                                      <div>
                                        <span className="text-white/60">Clave:</span>
                                        <span className="ml-2 text-white/80 font-mono">{item.clave}</span>
                                      </div>

                                      {/* Valor */}
                                      <div>
                                        <span className="text-white/60">Valor:</span>
                                        <div className="ml-2 mt-1">
                                          {(type === "signature" || type === "img" || type === "image" || type === "file") &&
                                            item.valor?.startsWith("data:") ? (
                                            <div className="flex justify-start">
                                              <img
                                                src={item.valor}
                                                alt="Vista previa"
                                                className="rounded-lg border border-gray-700 shadow-lg max-h-44 object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105"
                                                onClick={() => setImagenAmpliada(item.valor)}
                                              />
                                            </div>
                                          ) : (
                                            <span className="text-white/80 font-medium break-words">{item.valor}</span>
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
                  })}
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