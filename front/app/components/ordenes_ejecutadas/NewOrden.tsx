import React, { useState, useEffect } from 'react';
import TipoAcom from './TipoAcom';
import Fases from './Fases';
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Acondicionamiento, ListData, Plan } from "../../interfaces/NewOrden";
import { getOrdenesEjecutadas, postOrdenesEjecutadas, getOrdenEjecutadaById } from "../../services/ordenes_ejecutadas/ordenesEjecutadaServices"
import { getManuId } from "../../services/userDash/manufacturingServices"

// Hook para obtener datos
const useFetchData = () => {
  const [list_data, setListData] = useState<ListData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const plan: Plan = JSON.parse(localStorage.getItem("ejecutar") || "{}");
      const data = await getOrdenesEjecutadas(Number(plan.adaptation_id));
      const orden = await getOrdenEjecutadaById(Number(plan.adaptation_id));
      console.log("datos", orden)
      setListData(data);
      setError(null);
    } catch (e: any) {
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
const useEnviarData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarData = async (data: any) => {
    try {
      setLoading(true);
      await postOrdenesEjecutadas(data);
      localStorage.removeItem("ejecutar");
      window.close();
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { enviarData, loading, error };
};

// Componente principal como función normal sin React.FC
function NewOrden() {
  const [memoria, setMemoria] = useState<any[]>([]);
  const [estado_form, setEstado_form] = useState(false);
  const [finalizado_form, setFinalizado_form] = useState(false);

  const { list_data, loading, error } = useFetchData();
  const { enviarData, error: error_envio } = useEnviarData();

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
      <Text type="title">Órdenes de Acondicionamiento</Text>

      {list_data.acondicionamiento?.map((acon, index) => (
        <div
          key={`acon-${index}`}
          className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 mb-6 overflow-hidden"
        >
          <div className="bg-blue-50 w-full py-8 px-6 border-b border-gray-200 flex items-center justify-between">
            <Text type="subtitle">Orden #{acon.number_order}</Text>
            <BadgeCheck className="text-green-500 w-5 h-5" />
          </div>

          <div className="px-6 py-4 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {/* <div><span className="font-medium text-gray-600">Adaptation ID:</span> {acon.adaptation_id}</div> */}
            {/* <div><span className="font-medium text-gray-600">Maestra ID:</span> {acon.maestra_id}</div> */}
            <div className="sm:col-span-2"><span className="font-medium text-gray-600">Descripción Maestra:</span> {acon.descripcion_maestra}</div>
            <div><span className="font-medium text-gray-600">Línea Producción:</span> {acon.linea_produccion}</div>
            <div><span className="font-medium text-gray-600">Tipo Acond. FK:</span> {acon.maestra_tipo_acondicionamiento_fk}</div>
            <div><span className="font-medium text-gray-600">Fase FK:</span> {acon.maestra_fases_fk}</div>
            <div className="sm:col-span-2"><span className="font-medium text-gray-600">Status Dates:</span> {acon.status_dates}</div>
          </div>
        </div>
      ))}

      <AnimatePresence mode="wait">
        {!estado_form && (
          <motion.div
            key="tipoAcom"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TipoAcom
              proms={list_data.maestra_tipo_acondicionamiento_fk}
              setMemoria={setMemoria}
              memoria={memoria}
              estado_form={estado_form}
              setEstado_form={setEstado_form}
            />
          </motion.div>
        )}

        {estado_form && (
          <motion.div
            key="fases"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Fases
              proms={list_data.maestra_fases_fk}
              setMemoria={setMemoria}
              memoria={memoria}
              estado_form={!estado_form}
              setEstado_form={setEstado_form}
              finalizado_form={finalizado_form}
              setFinalizado_form={setFinalizado_form}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(estado_form && finalizado_form && memoria.length >= 2) && (
        <div className="w-full max-w-2xl mx-auto mt-4 px-4">
          <Text type="subtitle">Enviar Datos</Text>
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={handleFinalSubmit} variant="save" label="Guardar" disabled={!(estado_form && finalizado_form)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default NewOrden;
