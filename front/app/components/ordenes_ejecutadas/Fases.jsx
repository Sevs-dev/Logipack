import React, { useState, useRef, useEffect } from 'react';
import Text from "../text/Text";
import Button from "../buttons/buttons";

// Hook para enviar datos
const useEnviardata = () => {
  const enviarData = (data) => {
    console.log("confirmar datos fases", data);
  };
  return { enviarData };
};

const Fases = ({
  proms,
  setMemoria,
  memoria,
  estado_form,
  setEstado_form,
  finalizado_form,
  setFinalizado_form
}) => {
  const [info, setInfo] = useState({});
  const [lineaIndex, setLineaIndex] = useState(0);
  const [actividadIndex, setActividadIndex] = useState(0);
  const formRef = useRef();
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

    const datosConStage = {
      ...info,
      tipo_acon: lista.tipo_acondicionamiento_id,
      stage: lista.fases_fk
    };

    const nuevaMemoria = [...memoria, datosConStage];
    setMemoria(nuevaMemoria);

    formRef.current.reset();
    setInfo({});

    if (typeof callback === 'function') callback();
  };

  const handleNextActivity = () => {
    almacenarDatos(() => setActividadIndex((prev) => prev + 1));
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
      setFinalizado_form(true);
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

  useEffect(() => {
    if (actividadGrupo.length < 1) {
      setFinalizado_form(true);
    }
  }, []);

  return (
    <div className=" text-black w-full py-8 px-6 bg-white">
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {lista && (
          <div className=" text-black bg-white shadow-md rounded-lg mb-6 overflow-hidden">
            <header className=" text-black bg-blue-50 px-4 py-3 font-semibold">
              <Text type="title">Fases de la orden #{lineaIndex + 1} de {listas.length}</Text>
            </header>
            <div className={`${estado_form || finalizado_form ? 'hidden' : 'block'} p-6`}>
              <Text type="subtitle">Fase: {lista.fases_fk} | {lista.descripcion_fase}</Text>
              <Text type="subtitle">Actividades - Grupo {actividadIndex + 1} de {actividades.length}</Text>

              {/* Aquí está el grid de dos columnas */}
              <div className=" text-black grid grid-cols-1 md:grid-cols-2 gap-4">
                {actividadGrupo.map((tarea, j) => {
                  const config = typeof tarea.config === 'string' ? JSON.parse(tarea.config) : tarea.config;

                  return (
                    <div
                      key={`tarea-${j}`}
                      className=" text-black border border-gray-300 rounded-md p-4 mb-4 bg-gray-50"
                    >
                      <Text type="subtitle">Descripción: {tarea.descripcion_activitie}</Text>
                      {config.type === "select" && (
                        <select
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className=" text-black w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccione</option>
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
                            className=" text-black inline-flex items-center mr-4 cursor-pointer"
                          >
                            <input
                              type={config.type}
                              name={tarea.id_activitie}
                              value={opt}
                              required={tarea.binding}
                              onChange={inputChange}
                              className=" text-black form-checkbox form-radio "
                            />
                            <span className=" text-black ml-2">{opt}</span>
                          </label>
                        ))}

                      {(config.type === "signature" || config.type === "text") && (
                        <input
                          type="text"
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className=" text-black w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {config.type === "image" && (
                        <input
                          type="file"
                          accept="image/*"
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className=" text-black w-full"
                        />
                      )}

                      {config.type === "textarea" && (
                        <textarea
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className=" text-black w-full border border-gray-300 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {config.type === "file" && (
                        <input
                          type="file"
                          accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.pdf,.txt,.rtf"
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                          className=" text-black w-full"
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
                            className=" text-black w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                    </div>
                  );
                })}
              </div>

              <div className=" text-black flex justify-center space-x-4 mt-4">
                {actividadIndex === actividades.length - 1 ? (
                  <>
                    {lineaIndex === listas.length - 1 ? (
                      <Button onClick={handleFinalSubmit} variant="save" label="Confirmar" />
                    ) : (
                      <Button onClick={handleNextLine} variant="save" label="Siguiente línea" />
                    )}
                  </>
                ) : (
                  <Button onClick={handleNextActivity} variant="save" label="Siguiente línea" />
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>

  );
};

export default Fases;
