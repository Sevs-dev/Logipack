import React, { useState, useEffect } from 'react';
import { getConciliacion, guardar_conciliacion } from '@/app/services/planing/planingServices';
import { useParams } from 'next/navigation';
import Text from "@/app/components/text/Text";

// 👇 Definimos el tipo del estado
interface ConciliacionData {
  orden_ejecutada: string;
  adaptation_date_id: string;
  number_order: string;
  descripcion_maestra: string;
  codart: string;
  desart: string;
  quantityToProduce: string;
  faltante: string;
  adicionales: string;
  rechazo: string;
  danno_proceso: string;
  devolucion: string;
  sobrante: string;
  total: string;
  rendimiento: string;
  user: string;
}

// 👇 Tipado para InputEditable
const InputEditable = ({
  id,
  name,
  label,
  value,
  onChange,
}: {
  id: string;
  name: keyof ConciliacionData;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <p className="text-gray-400 text-center mb-2">{label}</p>
    <input
      type="number"
      step="any"
      id={id}
      name={name}
      required
      value={value}
      onChange={onChange}
      className="w-full text-center px-4 py-2 bg-white rounded-md text-gray-900 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

// 👇 Tipado para InputReadOnly
const InputReadOnly = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <p className="text-gray-400 text-center mb-2">{label}</p>
    <input
      type="number"
      value={value}
      readOnly
      className="w-full text-center px-4 py-2 bg-gray-100 rounded-md text-gray-800 border border-gray-300 shadow-inner"
    />
  </div>
);

const NewConsolida = () => {
  const params = useParams();

  const [data, setData] = useState<ConciliacionData>({
    orden_ejecutada: '',
    adaptation_date_id: '',
    number_order: '',
    descripcion_maestra: '',
    codart: '',
    desart: '',
    quantityToProduce: '',
    faltante: '',
    adicionales: '',
    rechazo: '',
    danno_proceso: '',
    devolucion: '',
    sobrante: '',
    total: '',
    rendimiento: '',
    user: '',
  });

  useEffect(() => {
    const obtener_conciliacion = async () => {
      try {
        const response = await getConciliacion(Number(params.id));
        setData((prev) => ({
          ...prev,
          orden_ejecutada: response?.orden?.orden_ejecutada ?? '',
          adaptation_date_id: response?.orden?.adaptation_date_id ?? '',
          number_order: response?.orden?.number_order ?? '',
          descripcion_maestra: response?.orden?.descripcion_maestra ?? '',
          codart: response?.conciliacion?.codart ?? '',
          desart: response?.conciliacion?.desart ?? '',
          quantityToProduce: response?.conciliacion?.quantityToProduce ?? '',
        }));
      } catch (error: unknown) {
        console.error("Error en getConciliacion:", error);
      }
    };

    obtener_conciliacion();
  }, []);

  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const usuario = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1];

    setData(prev => ({
      ...prev,
      [name]: value,
      user: usuario || prev.user,
    }));
  };

  useEffect(() => {
    const quantityToProduce = parseFloat(data.quantityToProduce) || 0;
    const faltante = parseFloat(data.faltante) || 0;
    const adicionales = parseFloat(data.adicionales) || 0;
    const rechazo = parseFloat(data.rechazo) || 0;
    const danno_proceso = parseFloat(data.danno_proceso) || 0;
    const devolucion = parseFloat(data.devolucion) || 0;
    const sobrante = parseFloat(data.sobrante) || 0;

    const total =
      quantityToProduce +
      adicionales +
      sobrante -
      (faltante + rechazo + danno_proceso + devolucion);

    const denominador = quantityToProduce - (rechazo + faltante);
    let rendimiento = 0;
    if (denominador !== 0) {
      rendimiento = ((total - danno_proceso) / denominador) * 100;
    }

    setData(prev => ({
      ...prev,
      total: total.toFixed(2),
      rendimiento: rendimiento.toFixed(2),
    }));
  }, [
    data.quantityToProduce,
    data.faltante,
    data.adicionales,
    data.rechazo,
    data.danno_proceso,
    data.devolucion,
    data.sobrante,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await guardar_conciliacion(data);
    if (response.message === 'ok') { 
      window.close();
    } else {
      console.log('Error al guardar el datos | datos existentes.');
    }
  };

  if (data?.orden_ejecutada === '') {
    return <div><h1>Cargando...</h1></div>;
  }

  if (data?.orden_ejecutada === undefined) {
    return <div><h1>Sin datos de conciliación</h1></div>;
  }

  return (
    <div className="w-full rounded-2xl bg-[#171e2d] border border-white/10 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600/20 to-blue-600/20 px-6 py-4 border-b border-white/10 backdrop-blur-md">
        <Text type="title" color="text-white">Formulario de Conciliación</Text>
      </div>

      <form id="formConciliacion" onSubmit={handleSubmit} className="space-y-10 p-8">

        {/* Información general */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center text-sm text-white">
          <div className="bg-white/5 p-4 rounded-xl shadow-inner">
            <p className="text-gray-400 mb-1">Orden N°</p>
            <p className="font-semibold">{data.number_order}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl shadow-inner">
            <p className="text-gray-400 mb-1">Descripción Maestra</p>
            <p className="font-semibold">{data.descripcion_maestra}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl shadow-inner">
            <p className="text-gray-400 mb-1">Código Artículo</p>
            <p className="font-semibold">{data.codart}</p>
          </div>
        </div>

        {/* Producción y Desperdicio */}
        <section>
          <Text type="title" color="text-white">Producción y Desperdicio</Text>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-2">
            <InputReadOnly label="Cantidad Teórica (a)" value={data.quantityToProduce} />
            {["Faltante (b)", "Adicionales (c)", "Rechazo (d)"].map((label, i) => {
              const key = label.toLowerCase().split(" ")[0] as keyof ConciliacionData;
              return (
                <InputEditable
                  key={i}
                  id={key}
                  name={key}
                  label={label}
                  value={data[key]}
                  onChange={inputChange}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {["Daño en Proceso (e)", "Devolución (f)", "Sobrante (g)"].map((label, i) => {
              const key = label.toLowerCase().split(" ")[0] as keyof ConciliacionData;
              return (
                <InputEditable
                  key={i}
                  id={key}
                  name={key}
                  label={label}
                  value={data[key]}
                  onChange={inputChange}
                />
              );
            })}
          </div>
        </section>

        {/* Totales */}
        <section>
          <Text type="title" color="text-white">Totales</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputReadOnly label="Total (h) = a + c + g - (b + d + e + f)" value={data.total} />
            <InputReadOnly label="Rendimiento (i) = (h - e) / (a - (d + b)) × 100" value={data.rendimiento} />
          </div>
        </section>

        {/* Botón */}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 text-sm rounded-lg hover:bg-blue-700 transition-all shadow-md"
          >Guardar Conciliación
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewConsolida;
