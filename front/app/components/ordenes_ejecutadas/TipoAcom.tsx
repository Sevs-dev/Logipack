import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { ActividadConfig, Actividad, Lista, TipoAcomProps } from "../../interfaces/TipoAcon"

// Hook para enviar datos
const useEnviardata = () => {
  const enviarData = (data: any) => {
    console.log("confirmar datos tipos", data);
  };
  return { enviarData };
};

const TipoAcom: React.FC<TipoAcomProps> = ({
  proms,
  setMemoria,
  memoria,
  estado_form,
  setEstado_form
}) => {
  const [info, setInfo] = useState<Record<string, any>>({});
  const [lineaIndex, setLineaIndex] = useState<number>(0);
  const [actividadIndex, setActividadIndex] = useState<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const { enviarData } = useEnviardata();

  // Recibir cambios de inputs
  const inputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type, value, checked, files } = e.target as HTMLInputElement;

    setInfo((prev) => {
      if (type === 'checkbox') {
        const current = prev[name] || [];
        return {
          ...prev,
          [name]: checked ? [...current, value] : current.filter((v: any) => v !== value),
        };
      }

      if (type === 'file') {
        return {
          ...prev,
          [name]: files && files.length > 1 ? Array.from(files) : files && files[0],
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // almacenar datos
  const almacenarDatos = (callback?: () => void) => {
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }

    const listas = proms || [];
    const lista = listas[lineaIndex];

    const datosConStage = {
      ...info,
      tipo_acon: lista.tipo_acondicionamiento_id,
      stage: lista.fases_fk
    };

    const nuevaMemoria = [...memoria, datosConStage];
    setMemoria(nuevaMemoria);

    formRef.current?.reset();
    setInfo({});

    if (typeof callback === 'function') callback();
  };

  // siguiente actividad
  const handleNextActivity = () => {
    almacenarDatos(() => {
      setActividadIndex((prev) => prev + 1);
    });
  };

  // siguiente linea
  const handleNextLine = () => {
    almacenarDatos(() => {
      setLineaIndex((prev) => prev + 1);
      setActividadIndex(0);
    });
  };

  // Confirmar envio
  const handleFinalSubmit = () => {
    almacenarDatos(() => {
      setEstado_form(true);
      enviarData(memoria);
    });
  };

  // Disparar evento submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    formRef.current?.reset();
  };

  // constrantes de iteracion
  const listas = proms || [];
  const lista = listas[lineaIndex];
  const actividades = lista?.actividades || [];
  const actividadGrupo = actividades[actividadIndex] || [];

  useEffect(() => {
    if (actividadGrupo.length < 1) {
      setEstado_form(true);
    }
    // eslint-disable-next-line
  }, []);

  // render dinámico de botón
  const renderBoton = () => {
    if (actividadIndex === actividades.length - 1) {
      return lineaIndex === listas.length - 1
        ? <Button onClick={handleFinalSubmit} variant="save" label="Confirmar" />
        : <Button onClick={handleNextLine} variant="save" label="Siguiente línea" />;
    }
    return <Button onClick={handleNextActivity} variant="save" label="Siguiente actividad" />;
  };

  return (
    <div className="text-black w-full py-8 px-6 bg-white">
      <form ref={formRef} onSubmit={handleSubmit}>
        {lista && (
          <div className="text-black bg-white shadow-md rounded-lg mb-6 overflow-hidden">
            <div className="bg-blue-50 w-full py-8 px-6 border-b border-gray-200 flex items-center justify-between">
              <Text type="title">Tipo de Acondicionamiento #{lineaIndex + 1} de {listas.length}</Text>
            </div>
            <div className="card-body" style={{ display: estado_form ? 'none' : 'block' }}>
              <Text type="subtitle">Fase: {lista.fases_fk + " | " + lista.descripcion_fase}</Text>
              <Text type="subtitle">Actividades - Grupo {actividadIndex + 1} de {actividades.length}</Text>

              {/* Mapeo de actividades */}
              {actividadGrupo.map((tarea: Actividad, j: number) => {
                const config: ActividadConfig = typeof tarea.config === 'string'
                  ? JSON.parse(tarea.config)
                  : tarea.config;

                return (
                  <div key={`tarea-${j}`} className="text-black border border-gray-300 rounded-md p-4 mb-4 bg-gray-50">
                    <Text type="subtitle">Descripción: {tarea.descripcion_activitie}</Text>

                    {config.type === "select" && (
                      <select
                        name={tarea.id_activitie}
                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        required={!!tarea.binding}
                        onChange={inputChange}>
                        <option value="">Seleccione</option>
                        {config.options?.map((opt, k) => (
                          <option key={`opt-${k}`} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {['checkbox', 'radio'].includes(config.type) &&
                      config.options?.map((opt, k) => (
                        <div className="form-check" key={`opt-${k}`}>
                          <input
                            className="mr-2"
                            type={config.type}
                            name={tarea.id_activitie}
                            value={opt}
                            required={!!tarea.binding}
                            onChange={inputChange}
                          />
                          <label className="form-check-label">{opt}</label>
                        </div>
                      ))}

                    {["signature", "text"].includes(config.type) && (
                      <input
                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        type="text"
                        name={tarea.id_activitie}
                        required={!!tarea.binding}
                        onChange={inputChange}
                      />
                    )}

                    {config.type === "image" && (
                      <input
                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        type="file"
                        name={tarea.id_activitie}
                        accept="image/*"
                        required={!!tarea.binding}
                        onChange={inputChange}
                      />
                    )}

                    {config.type === "textarea" && (
                      <textarea
                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        name={tarea.id_activitie}
                        required={!!tarea.binding}
                        onChange={inputChange}></textarea>
                    )}

                    {config.type === "file" && (
                      <input
                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        type="file"
                        name={tarea.id_activitie}
                        accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.pdf,.txt,.rtf"
                        required={!!tarea.binding}
                        onChange={inputChange}
                      />
                    )}

                    {!['select', 'checkbox', 'radio', 'signature', 'image', 'textarea', 'file', 'text'].includes(config.type) && (
                      <input
                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        type={config.type}
                        name={tarea.id_activitie}
                        required={!!tarea.binding}
                        onChange={inputChange}
                      />
                    )}
                  </div>
                );
              })}

              {/* Botones */}
              <div className="text-black flex justify-center space-x-4 mt-4">
                {renderBoton()}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TipoAcom;
