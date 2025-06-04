import React, { useState, useEffect } from 'react';
import TipoAcom from './TipoAcom';
import Fases from './Fases';
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { BadgeCheck } from "lucide-react";
import { div } from 'framer-motion/client';

// Hook para obtener datos
const useFetchData = () => {
  const [list_data, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {

    try {
      const plan = JSON.parse(localStorage.getItem("ejecutar") || "{}");
      const response = await fetch(`http://127.0.0.1:8000/api/getOrdenesEjecutadas/${plan.adaptation_id}`);
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

// Hook para enviar datos
const useEnviardata = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enviarData = async (data) => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/newOrdenesEjecutadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al enviar los datos');
      
      // sino hay errores  cierra la pestaña y limpia el localStorage
      localStorage.removeItem("ejecutar");
      window.close();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { enviarData, loading, error };
};

const App = () => {
  const [memoria, setMemoria] = useState([]);
  const [estado_form, setEstado_form] = useState(false);
  const [finalizado_form, setFinalizado_form] = useState(false);
  const { list_data, loading, error } = useFetchData();
  const { enviarData, error: error_envio } = useEnviardata();

  const handleFinalSubmit = () => {
    setEstado_form(true);
    setFinalizado_form(true);
    enviarData(memoria);
    if (error_envio) console.log(error_envio);
  };

  useEffect(() => {
    if (list_data?.acondicionamiento?.length) {
      setMemoria(list_data.acondicionamiento);
    }
  }, [list_data]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="w-full py-8 px-6 bg-white">
      <div className="w-full py-8 px-6 bg-white">
        <Text type="title"> Órdenes de Acondicionamiento</Text>

        {list_data.acondicionamiento?.map((acon, index) => (
          <div
            key={`acon-${index}`}
            className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 mb-6 overflow-hidden"
          >
            <div className="bg-blue-50 w-full py-8 px-6 border-b border-gray-200 flex items-center justify-between">
              <Text type="subtitle"  >
                Orden #{acon.number_order}
              </Text>
              <BadgeCheck className="text-green-500 w-5 h-5" />
            </div>

            <div className="px-6 py-4 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div><span className="font-medium text-gray-600">Adaptation ID:</span> {acon.adaptation_id}</div>
              <div><span className="font-medium text-gray-600">Maestra ID:</span> {acon.maestra_id}</div>
              <div className="sm:col-span-2"><span className="font-medium text-gray-600">Descripción Maestra:</span> {acon.descripcion_maestra}</div>
              <div><span className="font-medium text-gray-600">Línea Producción:</span> {acon.linea_produccion}</div>
              <div><span className="font-medium text-gray-600">Tipo Acond. FK:</span> {acon.maestra_tipo_acondicionamiento_fk}</div>
              <div><span className="font-medium text-gray-600">Fase FK:</span> {acon.maestra_fases_fk}</div>
              <div className="sm:col-span-2"><span className="font-medium text-gray-600">Status Dates:</span> {acon.status_dates}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tipo Acondicionamiento */}
      <TipoAcom
        proms={list_data.maestra_tipo_acondicionamiento_fk}
        setMemoria={setMemoria}
        memoria={memoria}
        estado_form={estado_form}
        setEstado_form={setEstado_form}
      />

      {/* Fases */}
      <Fases
        proms={list_data.maestra_fases_fk}
        setMemoria={setMemoria}
        memoria={memoria}
        estado_form={!estado_form}
        setEstado_form={setEstado_form}
        finalizado_form={finalizado_form}
        setFinalizado_form={setFinalizado_form}
      />

      {/* Enviar datos */}
      <div className="w-full max-w-2xl mx-auto mt-4 px-4">
        {(estado_form && finalizado_form && memoria.length >= 2) && (
          <div>
            <Text type="subtitle">Enviar Datos</Text>
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={handleFinalSubmit} variant="save" label="Guardar" disabled={!(estado_form && finalizado_form)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
