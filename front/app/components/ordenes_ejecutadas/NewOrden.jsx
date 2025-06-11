import React, { useState, useEffect } from 'react';
import TipoAcom from './TipoAcom';
import Fases from './Fases';

const useFetchData = () => {
  const [list_data, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/procesar_orden/4');
      if (!response.ok) throw new Error('Error al obtener los datos');
      const data = await response.json();
      setListData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { list_data, loading, error, reloadData: fetchData };
};

const App = () => {
  const { list_data, loading, error } = useFetchData();
  const [acondicionamiento, setAcondicionamiento] = useState({
    id: '',
    adaptation_id: '',
    maestra_id: '',
    number_order: '',
    descripcion_maestra: '',
    maestra_fases_fk: '',
    maestra_tipo_acondicionamiento_fk: '',
    linea_produccion: '',
    proceso: '',
    estado: '',
    status_dates: ''
  });

  const [fase_save, setFaseSave] = useState(false);
  const [tipo_acom_save, setTipoAcomSave] = useState(false);

  useEffect(() => {
    if (list_data?.acondicionamiento) {
      setAcondicionamiento(list_data.acondicionamiento);
    }
  }, [list_data]);

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario finalizado con memoria:');
    localStorage.clear();
    setFaseSave(false);
    setTipoAcomSave(false);
  }

  if (loading) return <div className="p-6 text-center text-lg font-medium">Cargando...</div>;
  if (error) return <div className="p-6 text-center text-red-600 font-semibold">Error: {error}</div>;

  return (
    <div className="py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Órdenes de Acondicionamiento</h2>
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4 text-lg font-semibold">
            Orden #{acondicionamiento.number_order}
          </div>
          <div className="px-6 py-4 space-y-2 text-gray-700">
            <p><span className="font-semibold">Adaptation ID:</span> {acondicionamiento.adaptation_id}</p>
            <p><span className="font-semibold">Maestra ID:</span> {acondicionamiento.maestra_id}</p>
            <p><span className="font-semibold">Descripción Maestra:</span> {acondicionamiento.descripcion_maestra}</p>
            <p><span className="font-semibold">Línea Producción:</span> {acondicionamiento.linea_produccion}</p>
            <p><span className="font-semibold">Tipo Acondicionamiento FK:</span> {acondicionamiento.maestra_tipo_acondicionamiento_fk}</p>
            <p><span className="font-semibold">Fase FK:</span> {acondicionamiento.maestra_fases_fk}</p>
            <p><span className="font-semibold">Status Dates:</span> {acondicionamiento.estado}</p>
          </div>
        </div>
      </div>

      {/* Fases */}
      <Fases
        proms={list_data?.maestra_fases_fk}
        setFaseSave={setFaseSave}
        fase_save={fase_save}
      />

      {/* Tipo Acondicionamiento */}
      <TipoAcom
        proms={list_data?.maestra_tipo_acondicionamiento_fk}
        setTipoAcomSave={setTipoAcomSave}
        tipo_acom_save={tipo_acom_save}
      />

      {/* Validación de guardado */}
      {localStorage.getItem('fase_save') === "guardado" &&
        localStorage.getItem('tipo_acom_save') === "guardado" && (
          <div className="w-full max-w-xl mt-8">
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-3 font-semibold">
                Información General de la Fase
              </div>
              <div className="px-6 py-4 flex justify-center">
                <button
                  onClick={handleFinalSubmit}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition"
                >
                  Finaliza y Guarda
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default App;
