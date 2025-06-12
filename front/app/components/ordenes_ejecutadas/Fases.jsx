import React, { useState, useRef, useEffect } from 'react';

const Fases = ({ proms, setFaseSave, fase_save }) => {
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

  const [memoria_fase, setMemoriaFase] = useState(() => {
    const dataGuardada = localStorage.getItem('memoria_fase');
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
  const info = memoria_fase[lineaIndex] || {};

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
      if (!memoria_fase[lineaIndex]) {
        const initialValues = {};
        formsParsed.forEach((item) => {
          initialValues[item.clave] = item.valor || '';
        });
        setMemoriaFase((prev) => {
          const actualizado = {
            ...prev,
            [lineaIndex]: initialValues
          };
          localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
          return actualizado;
        });
      }
    }
  }, [lineaIndex, lista]);

  const inputChange = (e) => {
    const { name, value } = e.target;
    setMemoriaFase((prev) => {
      const actualizado = {
        ...prev,
        [lineaIndex]: {
          ...prev[lineaIndex],
          [name]: value
        }
      };
      localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
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
          valor: memoria_fase[index]?.[form.clave] || ''
        }))
      )
    }));

    const estructura = { maestra_fases_fk: datosFinales };
    localStorage.setItem('memoria_fase', JSON.stringify(memoria_fase));
    localStorage.setItem('memoria_fase_save', JSON.stringify(estructura));
    setFaseSave(false);
    localStorage.setItem('fase_save', "guardado");
  };


  if (fase_save === false) {
    if (proms.length === 0) {
      localStorage.setItem('fase_save', "guardado");
    }
    return (
      <div className="max-w-2xl mx-auto my-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {localStorage.getItem('fase_save') === "guardado" ? "FASE : Guardado" : "Iniciar Fase"}
              </span>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium shadow-sm ${localStorage.getItem('fase_save') === "guardado"
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                disabled={localStorage.getItem('fase_save') === "guardado"}
                onClick={() => { setFaseSave(true); }}
              >
                {localStorage.getItem('fase_save') === "guardado" ? "Completado" : "Iniciar"}
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
          <h3 className="text-white font-medium">Información General de la Fase</h3>
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
              let config = item.config;
              if (typeof config === 'string') {
                try {
                  config = JSON.parse(config);
                } catch {
                  config = {};
                }
              }

              return (
                <div key={`item-${index}`} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {item.descripcion_activitie}
                  </label>
                  {config.type === "select" ? (
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700" // Añadido text-gray-700
                      required={item.binding}
                      name={item.clave}
                      value={info[item.clave] ?? ''}
                      onChange={inputChange}
                    >
                      <option value="">Seleccione</option>
                      {config.options?.map((opt, k) => (
                        <option key={`opt-${index}-${k}`} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700" // Añadido text-gray-700
                      type={config.type || "text"}
                      required={item.binding}
                      name={item.clave}
                      value={info[item.clave] ?? ''}
                      placeholder={item.descripcion_activitie}
                      onChange={inputChange}
                    />
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

export default Fases;
