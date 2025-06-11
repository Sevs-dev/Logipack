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
    forms: []
  });

  const [memoria_fase, setMemoriaFase] = useState(() => {
    const dataGuardada = localStorage.getItem('memoria_fase');
    try {
      return dataGuardada ? JSON.parse(dataGuardada) : {};
    } catch {
      return {};
    }
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
        forms: formsParsed
      });

      if (!memoria_fase[lineaIndex]) {
        const initialValues = {};
        formsParsed.forEach(item => {
          initialValues[item.clave] = item.valor || '';
        });
        const actualizado = {
          ...memoria_fase,
          [lineaIndex]: initialValues
        };
        localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
        setMemoriaFase(actualizado);
      }
    }
  }, [lineaIndex, lista]);

  const inputChange = (e) => {
    const { name, value } = e.target;
    const actualizado = {
      ...memoria_fase,
      [lineaIndex]: {
        ...memoria_fase[lineaIndex],
        [name]: value
      }
    };
    localStorage.setItem('memoria_fase', JSON.stringify(actualizado));
    setMemoriaFase(actualizado);
  };

  const handleAnteriorLine = (e) => {
    e.preventDefault();
    if (formRef.current.checkValidity()) {
      if (lineaIndex > 0) setLineaIndex(prev => prev - 1);
    } else {
      formRef.current.reportValidity();
    }
  };

  const handleNextLine = (e) => {
    e.preventDefault();
    if (formRef.current.checkValidity()) {
      if (lineaIndex < listas.length - 1) setLineaIndex(prev => prev + 1);
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
      forms: JSON.stringify(
        JSON.parse(item.forms).map(form => ({
          ...form,
          valor: memoria_fase[index]?.[form.clave] || ''
        }))
      )
    }));

    localStorage.setItem('memoria_fase', JSON.stringify(memoria_fase));
    setFaseSave(false);
    localStorage.setItem('fase_save', "guardado");
    console.log('Guardado final:', { maestra_fases_fk: datosFinales });
  };

  if (fase_save === false) {
    if (proms.length === 0) {
      localStorage.setItem('fase_save', "guardado");
    }
    return (
      <div className="max-w-xl mx-auto mt-8 p-4 bg-white rounded-xl shadow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-green-700">Fase Inicial</h2>
          <button
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            disabled={localStorage.getItem('fase_save') === "guardado"}
            onClick={() => setFaseSave(true)}
          >
            Iniciar
          </button>
        </div>
        <p className="text-sm text-gray-700">
          {localStorage.getItem('fase_save') === "guardado" ? "Fase Guardada" : "Iniciar Fase"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      {/* Información general */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg font-semibold">
        Información General de la Fase
      </div>
      <div className="bg-white p-4 rounded-b-lg shadow mb-6 space-y-2 text-sm text-gray-700">
        <p><strong>ID:</strong> {fase.id}</p>
        <p><strong>Orden Ejecutada:</strong> {fase.orden_ejecutada}</p>
        <p><strong>Adaptation ID:</strong> {fase.adaptation_id}</p>
        <p><strong>Tipo Acondicionamiento:</strong> {fase.tipo_acondicionamiento_fk}</p>
        <p><strong>Fases FK:</strong> {fase.fases_fk}</p>
      </div>

      {/* Formulario */}
      <form ref={formRef} onSubmit={handleFinalSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
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
              <div className="mb-4" key={`item-${index}`}>
                <label className="block mb-1 font-medium text-gray-800">{item.descripcion_actividad}</label>
                {config.type === "select" ? (
                  <select
                    name={item.clave}
                    required={item.binding}
                    value={info[item.clave] || ''}
                    onChange={inputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                  >
                    <option value="">Seleccione</option>
                    {config.options?.map((opt, k) => (
                      <option key={`opt-${index}-${k}`} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={config.type || "text"}
                    name={item.clave}
                    required={item.binding}
                    value={info[item.clave] || ''}
                    placeholder={item.descripcion_actividad}
                    onChange={inputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleAnteriorLine}
            disabled={lineaIndex === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded disabled:opacity-50"
          >
            ← Anterior
          </button>

          <button
            onClick={handleNextLine}
            disabled={lineaIndex >= listas.length - 1}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Siguiente →
          </button>

          <button
            type="submit"
            disabled={lineaIndex !== listas.length - 1}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
          >
            Finalizar
          </button>
        </div>
      </form>
    </div>
  );
};

export default Fases;
