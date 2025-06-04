import React, { useState, useRef, useEffect } from 'react';
import Text from "../text/Text";
import Button from "../buttons/buttons";

// Hook para enviar datos
const useEnviardata = () => {
  const enviarData = (data) => {
    console.log("confirmar datos tipos", data);
  };
  return { enviarData };
};

const TipoAcom = ({
  proms,
  setMemoria,
  memoria,
  estado_form,
  setEstado_form,
}) => {
  const [info, setInfo] = useState({});
  const [lineaIndex, setLineaIndex] = useState(0);
  const [actividadIndex, setActividadIndex] = useState(0);
  const formRef = useRef(null);
  const { enviarData } = useEnviardata();

  const inputChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    setInfo((prev) => {
      if (type === 'checkbox') {
        const current = prev[name] || [];
        return {
          ...prev,
          [name]: checked ? [...current, value] : current.filter((v) => v !== value),
        };
      }
      if (type === 'file') {
        return {
          ...prev,
          [name]: files.length > 1 ? Array.from(files) : files[0],
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const almacenarDatos = (callback) => {
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    const listas = proms || [];
    const lista = listas[lineaIndex];
    const datosConStage = {
      ...info,
      tipo_acon: lista?.tipo_acondicionamiento_id,
      stage: lista?.fases_fk,
    };

    const nuevaMemoria = [...memoria, datosConStage];
    setMemoria(nuevaMemoria);
    formRef.current.reset();
    setInfo({});
    if (typeof callback === 'function') callback();
  };

  const handleNextActivity = () => {
    almacenarDatos(() => {
      setActividadIndex((prev) => prev + 1);
    });
  };

  const handleNextLine = () => {
    almacenarDatos(() => {
      setLineaIndex((prev) => prev + 1);
      setActividadIndex(0);
    });
  };

  const handleFinalSubmit = () => {
    almacenarDatos(() => {
      setEstado_form(true);
      enviarData(memoria);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    formRef.current.reset();
  };

  const listas = proms || [];
  const lista = listas[lineaIndex];
  const actividades = lista?.actividades || [];
  const actividadGrupo = actividades[actividadIndex] || [];

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {lista && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <header className="bg-gray-800 text-white px-6 py-4">
              <h2 className="text-lg font-semibold">
                Tipo de Acondicionamiento #{lineaIndex + 1} de {listas.length}
              </h2>
            </header>

            {!estado_form && (
              <div className="p-6 space-y-4">
                <h3 className="text-md font-medium text-gray-700">
                  Fase: {lista.fases_fk} | {lista.descripcion_fase}
                </h3>
                <h4 className="text-sm font-semibold text-gray-600">
                  Actividades - Grupo {actividadIndex + 1} de {actividades.length}
                </h4>

                {/* Mapeo de actividades */}
                {actividadGrupo.map((tarea, j) => {
                  const config =
                    typeof tarea.config === 'string' ? JSON.parse(tarea.config) : tarea.config;

                  return (
                    <div
                      key={`tarea-${j}`}
                      className="border border-gray-300 rounded-md p-4 bg-gray-50"
                    >
                      <p className="mb-2 font-semibold text-gray-800">
                        Descripción: {tarea.descripcion_activitie}
                      </p>

                      {config.type === 'select' && (
                        <select
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Seleccione
                          </option>
                          {config.options.map((opt, k) => (
                            <option key={`opt-${k}`} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {['checkbox', 'radio'].includes(config.type) &&
                        config.options.map((opt, k) => (
                          <label
                            key={`opt-${k}`}
                            className="inline-flex items-center space-x-2 mr-4 cursor-pointer"
                          >
                            <input
                              type={config.type}
                              name={tarea.id_activitie}
                              value={opt}
                              required={tarea.binding}
                              onChange={inputChange}
                              className="form-checkbox h-5 w-5 text-indigo-600"
                            />
                            <span className="text-gray-700">{opt}</span>
                          </label>
                        ))}

                      {(config.type === 'signature' || config.type === 'text') && (
                        <input
                          type="text"
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}

                      {config.type === 'image' && (
                        <input
                          type="file"
                          name={tarea.id_activitie}
                          accept="image/*"
                          required={tarea.binding}
                          onChange={inputChange}
                          className="w-full border border-gray-300 rounded-md p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}

                      {config.type === 'textarea' && (
                        <textarea
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className="w-full border border-gray-300 rounded-md p-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={4}
                        />
                      )}

                      {config.type === 'file' && (
                        <input
                          type="file"
                          name={tarea.id_activitie}
                          accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.pdf,.txt,.rtf"
                          required={tarea.binding}
                          onChange={inputChange}
                          className="w-full border border-gray-300 rounded-md p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}

                      {![
                        'select',
                        'checkbox',
                        'radio',
                        'signature',
                        'image',
                        'textarea',
                        'file',
                        'text',
                      ].includes(config.type) && (
                        <input
                          type={config.type}
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Botones */}
                <div className="flex justify-end gap-3 mt-6">
                  {actividadIndex === actividades.length - 1 ? (
                    lineaIndex === listas.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextLine}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition"
                      >
                        Siguiente línea
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextActivity}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition"
                    >
                      Siguiente actividad
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default TipoAcom;
