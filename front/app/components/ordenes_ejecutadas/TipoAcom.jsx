import React, { useState, useRef, useEffect } from 'react';

const TipoAcom = ({ proms, setTipoAcomSave, tipo_acom_save }) => {
  const formRef = useRef();
  const [lineaIndex, setLineaIndex] = useState(0);
  const [fase, setFase] = useState({
    id: '',
    orden_ejecutada: '',
    adaptation_id: '',
    tipo_acondicionamiento_fk: '',
    fases_fk: '',
    description_fase: '',
    phase_type: '',
    forms: []
  });

  const [memoria_tipo_acom, setMemoriaTipoAcom] = useState(() => {
    const dataGuardada = localStorage.getItem('memoria_tipo_acom');
    if (dataGuardada) {
      try {
        return JSON.parse(dataGuardada);
      } catch {
        return {};
      }
    }
    return {};
  });

  const listas = proms || [];
  const lista = listas[lineaIndex] || {};
  const info = memoria_tipo_acom[lineaIndex] || {};

  useEffect(() => {
    if (lista && lista.forms) {
      let formsParsed = [];
      try {
        formsParsed = JSON.parse(lista.forms);
      } catch (e) {
        console.warn('Error al parsear forms:', e);
      }

      setFase({
        id: lista.id || '',
        orden_ejecutada: lista.orden_ejecutada || '',
        adaptation_id: lista.adaptation_id || '',
        tipo_acondicionamiento_fk: lista.tipo_acondicionamiento_fk || '',
        fases_fk: lista.fases_fk || '',
        description_fase: lista.description_fase || '',
        phase_type: lista.phase_type || '',
        forms: formsParsed
      });

      // Solo inicializar si no existe ya
      if (!memoria_tipo_acom[lineaIndex]) {
        const initialValues = {};
        formsParsed.forEach((item) => {
          initialValues[item.clave] = item.valor || '';
        });
        setMemoriaTipoAcom((prev) => {
          const actualizado = {
            ...prev,
            [lineaIndex]: initialValues
          };
          localStorage.setItem('memoria_tipo_acom', JSON.stringify(actualizado));
          return actualizado;
        });
      }
    }
  }, [lineaIndex, lista]);

  const inputChange = (e) => {
    const { name, value } = e.target;
    setMemoriaTipoAcom((prev) => {
      const actualizado = {
        ...prev,
        [lineaIndex]: {
          ...prev[lineaIndex],
          [name]: value
        }
      };
      localStorage.setItem('memoria_tipo_acom', JSON.stringify(actualizado));
      return actualizado;
    });
  };

  const handleAnteriorLine = (e) => {
    e.preventDefault();
    if (formRef.current.checkValidity()) {
      if (lineaIndex > 0) setLineaIndex((prev) => prev - 1);
    } else {
      formRef.current.reportValidity();
    }
  };

  const handleNextLine = (e) => {
    e.preventDefault();
    if (formRef.current.checkValidity()) {
      if (lineaIndex < listas.length - 1) setLineaIndex((prev) => prev + 1);
    } else {
      formRef.current.reportValidity();
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    const datosFinales = listas.map((item, index) => ({
      id: item.id,
      orden_ejecutada: String(item.orden_ejecutada),
      adaptation_id: String(item.adaptation_id),
      tipo_acondicionamiento_fk: String(item.tipo_acondicionamiento_fk),
      fases_fk: String(item.fases_fk),
      description_fase: String(item.description_fase),
      phase_type: String(item.phase_type),
      forms: JSON.stringify(
        JSON.parse(item.forms).map((form) => ({
          ...form,
          valor: memoria_tipo_acom[index]?.[form.clave] || ''
        }))
      )
    }));

    const estructura = { maestra_tipo_acom_fk: datosFinales };
    localStorage.setItem('memoria_tipo_acom', JSON.stringify(memoria_tipo_acom));
    localStorage.setItem('memoria_tipo_acom_save', JSON.stringify(estructura));
    setTipoAcomSave(false);
    localStorage.setItem('tipo_acom_save', "guardado");
  };


  if (tipo_acom_save === false) {
    if (proms.length === 0) {
      localStorage.setItem('tipo_acom_save', "guardado");
    }
    return (
      <div className="max-w-2xl mx-auto my-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {localStorage.getItem('tipo_acom_save') === "guardado" ? "TIPO ACONDICIONAMIENTO : Guardado" : "Iniciar Tipo Acondicionamiento"}
              </span>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium shadow-sm ${localStorage.getItem('tipo_acom_save') === "guardado"
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                disabled={localStorage.getItem('tipo_acom_save') === "guardado"}
                onClick={() => { setTipoAcomSave(true); }}
              >
                {localStorage.getItem('tipo_acom_save') === "guardado" ? "Completado" : "Iniciar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-4 space-y-4">
      {/* Información General */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <h3 className="text-white font-medium">Información General del tipo de acondicionamiento</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">ID</p>
              <p className="font-medium">{fase.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Orden Ejecutada</p>
              <p className="font-medium">{fase.orden_ejecutada}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Adaptation ID</p>
              <p className="font-medium">{fase.adaptation_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo Acondicionamiento</p>
              <p className="font-medium">{fase.tipo_acondicionamiento_fk}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fases FK</p>
              <p className="font-medium">{fase.fases_fk}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fase Descripción</p>
              <p className="font-medium">{fase.description_fase}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Tipo de Fase</p>
              <p className="font-medium">{fase.phase_type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form ref={formRef} onSubmit={handleFinalSubmit}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="p-4 space-y-4">
            {fase.forms.map((item, index) => {

              // Formatear y obtener valores de los campos del componete
              let config = item.config;
              try {
                if (typeof config === "string") {
                  config = JSON.parse(config); // 1er parseo
                }

                if (typeof config === "string") {
                  config = JSON.parse(config); // 2do parseo (solo si aún es string)
                }
              } catch (error) {
                // console.error("Error al parsear config en index", index, item.config, error);
                config = {}; // o null según lo que prefieras
              }
              const { type, options } = config;

              return (
                <div key={`item-${index}`} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {item.descripcion_activitie}
                  </label>
                  {/* Componentes */}
                  {type === "select" && (
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 
                        rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      name={item.clave} // misma name para radio group
                      value={info[item.clave] ?? ''}
                      required={item.binding}
                      onChange={inputChange}>
                      <option value="">Seleccione</option>
                      {options.map((opt, k) => (
                        <option key={`opt-${k}`} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {type === "file" && (
                    <input
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      type="file"
                      accept="application/pdf"
                      required={item.binding}
                      name={item.clave}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result; // contiene data:<tipo>;base64,<contenido>
                            setMemoriaFase((prev) => {
                              const actualizado = {
                                ...prev,
                                [lineaIndex]: {
                                  ...prev[lineaIndex],
                                  [item.clave]: base64
                                }
                              };
                              localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
                              return actualizado;
                            });
                          };
                          reader.readAsDataURL(file); // convierte a base64
                        }
                      }}
                    />
                  )}
                  {type === "image" && (
                    <input
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      type="file"
                      accept="image/*"
                      required={item.binding}
                      name={item.clave}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result; // contiene data:<tipo>;base64,<contenido>
                            setMemoriaFase((prev) => {
                              const actualizado = {
                                ...prev,
                                [lineaIndex]: {
                                  ...prev[lineaIndex],
                                  [item.clave]: base64
                                }
                              };
                              localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
                              return actualizado;
                            });
                          };
                          reader.readAsDataURL(file); // convierte a base64
                        }
                      }}
                    />
                  )}
                  {type === "number" && (
                    <input
                      type="number"
                      className="block w-full px-3 py-2 border border-gray-300 
                        rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      placeholder={item.descripcion_activitie}
                      name={item.clave} // misma name para radio group
                      value={info[item.clave] ?? ''}
                      required={item.binding}
                      onChange={inputChange}
                    />
                  )}

                  {type === "text" && (
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 
                        rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      placeholder={item.descripcion_activitie}
                      name={item.clave}
                      value={info[item.clave] ?? ''}
                      required={item.binding}
                      onChange={inputChange}
                    />
                  )}
                  {type === "radio" && (
                    options.map((option, idx) => (
                      <label key={idx} className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name={item.clave}
                          value={option}
                          checked={info[item.clave] === option}
                          onChange={(e) => {
                            const { value } = e.target;
                            setMemoriaFase((prev) => {
                              const actualizado = {
                                ...prev,
                                [lineaIndex]: {
                                  ...prev[lineaIndex],
                                  [item.clave]: value
                                }
                              };
                              localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
                              return actualizado;
                            });
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="block text-sm font-medium text-gray-700">{option}</span>
                      </label>
                    ))
                  )}
                  {type === "checkbox" && (
                    options.map((option, idx) => (
                      <label key={idx} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={item.clave}
                          checked={Array.isArray(info[item.clave]) && info[item.clave].includes(option)}
                          onChange={(e) => {
                            const { checked } = e.target;
                            setMemoriaFase((prev) => {
                              const prevArr = Array.isArray(prev[lineaIndex]?.[item.clave])
                                ? prev[lineaIndex][item.clave]
                                : [];
                              const newArr = checked
                                ? [...prevArr, option]
                                : prevArr.filter(val => val !== option);

                              const actualizado = {
                                ...prev,
                                [lineaIndex]: {
                                  ...prev[lineaIndex],
                                  [item.clave]: newArr
                                }
                              };

                              localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
                              return actualizado;
                            });
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="block text-sm font-medium text-gray-700">{option}</span>
                      </label>
                    ))
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAnteriorLine}
            disabled={lineaIndex === 0}
          >
            ← Anterior
          </button>

          <button
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleNextLine}
            disabled={lineaIndex >= listas.length - 1}
          >
            Siguiente →
          </button>

          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={lineaIndex !== listas.length - 1}
          >
            Finalizar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TipoAcom;
