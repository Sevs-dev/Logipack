import React, { useState, useRef, useEffect } from 'react';

// Hook para enviar datos
const useEnviardata = () => {

  // funcion para enviar datos
  const enviarData = (data) => {
    console.log("confirmar datos tipos", data);
  };

  return { enviarData };
};

// componente Lineas de Acondicionamiento
const TipoAcom = ({
  proms,
  setMemoria,
  memoria,
  estado_form,
  setEstado_form
}) => {
  const [info, setInfo] = useState({});
  const [lineaIndex, setLineaIndex] = useState(0);
  const [actividadIndex, setActividadIndex] = useState(0);
  const formRef = useRef();
  const { enviarData } = useEnviardata();

  // Recibir cambios de inputs
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

  // almacenar datos
  const almacenarDatos = (callback) => {
    // Verifica que todos los campos del formulario sean válidos
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity(); // Muestra mensajes de validación
      return; // Detiene la ejecución si el formulario no es válido
    }

    // Construye un objeto con los datos actuales más el valor de "stage" (manual)
    const datosConStage = {
      ...info,               // Copia los datos del formulario
      tipo_acon: lista.tipo_acondicionamiento_id,
      stage: lista.fases_fk  // Agrega la fase actual como 'stage'
    };

    // Crea una nueva copia de la memoria con el nuevo dato incluido
    const nuevaMemoria = [...memoria, datosConStage];

    // Actualiza el estado con los nuevos datos
    setMemoria(nuevaMemoria);

    // Limpia el formulario y los datos temporales
    formRef.current.reset(); // Limpia los campos del formulario
    setInfo({});             // Reinicia el estado de info

    // Ejecuta el callback si se proporciona (por ejemplo, finalizar)
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
      setEstado_form(true); // Marca el formulario como completado

      // Envía los datos actualizados (incluyendo el último formulario)
      enviarData(memoria);
    });
  };

  // Disparar evento submit
  const handleSubmit = (e) => {
    e.preventDefault();
    ref.current.reset();
  }

  useEffect(() => {
    if (actividadGrupo.length < 1) {
      setEstado_form(true);
    }
  }, []);

  // constrantes de iteracion
  const listas = proms || [];
  const lista = listas[lineaIndex];
  const actividades = lista?.actividades || [];
  const actividadGrupo = actividades[actividadIndex] || [];

  return (
    <>
      <div className="container py-4 w-50" style={{ marginTop: '-50px' }}>
        <form ref={formRef} onSubmit={handleSubmit}>
          {lista && (
            <div className="card mb-5 shadow-sm">
              <div className="card-header bg-secondary text-white">
                Tipo de Acondicionamiento #{lineaIndex + 1} de {listas.length}
              </div>
              <div className="card-body" style={{ display: estado_form ? 'none' : 'block' }}>
                <h5>
                  Fase: {lista.fases_fk + " | " + lista.descripcion_fase}
                </h5>
                <h5>
                  Actividades - Grupo {actividadIndex + 1} de {actividades.length}
                </h5>

                {/* Mapeo de actividades */}
                {actividadGrupo.map((tarea, j) => {
                  const config = typeof tarea.config === 'string' ? JSON.parse(tarea.config) : tarea.config;

                  // renderizado de actividades
                  return (
                    <div key={`tarea-${j}`} className="border p-3 mb-3 rounded bg-light">
                      <p><strong>Descripción:</strong> {tarea.descripcion_activitie}</p>

                      {config.type === "select" && (
                        <select
                          name={tarea.id_activitie}
                          className="form-select"
                          required={tarea.binding}
                          onChange={inputChange}>
                          <option value="">Seleccione</option>
                          {config.options.map((opt, k) => (
                            <option key={`opt-${k}`} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {['checkbox', 'radio'].includes(config.type) &&
                        config.options.map((opt, k) => (
                          <div className="form-check" key={`opt-${k}`}>
                            <input
                              className="form-check-input"
                              type={config.type}
                              name={tarea.id_activitie}
                              value={opt}
                              required={tarea.binding}
                              onChange={inputChange}
                            />
                            <label className="form-check-label">{opt}</label>
                          </div>
                        ))}

                      {config.type === "signature" || config.type === "text" ? (
                        <input
                          className="form-control"
                          type="text"
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}
                        />
                      ) : null}

                      {config.type === "image" && (
                        <input
                          className="form-control"
                          type="file"
                          name={tarea.id_activitie}
                          accept="image/*"
                          required={tarea.binding}
                          onChange={inputChange}
                        />
                      )}

                      {config.type === "textarea" && (
                        <textarea
                          className="form-control"
                          name={tarea.id_activitie}
                          required={tarea.binding}
                          onChange={inputChange}></textarea>
                      )}

                      {config.type === "file" && (
                        <input
                          className="form-control"
                          type="file"
                          name={tarea.id_activitie}
                          accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.pdf,.txt,.rtf"
                          required={tarea.binding}
                          onChange={inputChange}
                        />
                      )}

                      {!['select', 'checkbox', 'radio', 'signature',
                        'image', 'textarea', 'file', 'text'].includes(config.type) && (
                          <input
                            className="form-control"
                            type={config.type}
                            name={tarea.id_activitie}
                            required={tarea.binding}
                            onChange={inputChange}
                          />
                        )}
                    </div>
                  );
                })}

                {/* Botones de siguiente actividad y siguiente linea */}
                <div className="d-flex justify-content-end gap-2 mb-3">
                  {actividadIndex === actividades.length - 1 ? (
                    <>
                      {lineaIndex === listas.length - 1 ? (
                        <button type="button" className="btn btn-success" onClick={handleFinalSubmit}>
                          Confirmar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleNextLine}>
                          Siguiente línea
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNextActivity}>
                      Siguiente actividad
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

export default TipoAcom;
