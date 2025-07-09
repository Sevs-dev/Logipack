
import { useEffect, useState } from "react";
import Text from "../text/Text";

const App = () => {
  const [local, setLocal] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("ejecutar");
    if (data) {
      setLocal(JSON.parse(data));
    }
  }, []);

  if (!local || !local.orden) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white text-xl font-semibold">No hay datos de la orden</p>
      </div>
    );
  }

  const orden = local.orden;
  const linea = local.linea;
  const tipo = local.tipo;
  const user = local.user;
  return (
    <>
      <div className="mb-6 p-4 bg-white shadow rounded-xl border">
        <p className="text-gray-700"><span className="font-semibold">Orden N°:</span> {orden?.number_order}</p>
        <p className="text-gray-700"><span className="font-semibold">Descripción:</span> {orden?.descripcion_maestra}</p>
        <p className="text-gray-700"><span className="font-semibold">Proceso:</span> {orden?.proceso}</p>
        <p className="text-gray-700"><span className="font-semibold">Linea No:</span> {linea}</p>
        <p className="text-gray-700"><span className="font-semibold">Estado:</span> {orden?.estado}</p>
      </div>
      <div className="mb-6 p-4 bg-white shadow rounded-xl border">
        <div className="w-full bg-white border border-gray-200 rounded-xl p-6 md:p-10 space-y-8">
          {/* Información General */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-5 rounded-xl shadow">
            <Text type="title" color="text-[#ffff]">
              Fase de Actividades (Despeje de linea inicial)
              {/* {fase.description_fase} ({fase.phase_type}) */}
            </Text>
          </div>
          <form className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-6">
              <div className="space-y-2">

                {/* Fases */}
                <input type="number"
                  className="block w-full px-3 py-2 border border-gray-300 
                  rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  placeholder={1}
                  name={11}
                  value={""}
                  required={true}
                />

              </div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default App;