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
    forms: []
  });

  const [memoria_tipo_acom, setMemoriaTipoAcom] = useState(() => {
    const dataGuardada = localStorage.getItem('memoria_tipo_acom');
    try {
      return dataGuardada ? JSON.parse(dataGuardada) : {};
    } catch {
      return {};
    }
  });

  const listas = proms || [];
  const lista = listas[lineaIndex] || {};
  const info = memoria_tipo_acom[lineaIndex] || {};

  useEffect(() => {
    if (lista && lista.forms) {
      let formsParsed = [];
      try {
        formsParsed = JSON.parse(lista.forms);
      } catch {
        console.warn('Error al parsear forms');
      }

      setFase({
        id: lista.id || '',
        orden_ejecutada: lista.orden_ejecutada || '',
        adaptation_id: lista.adaptation_id || '',
        tipo_acondicionamiento_fk: lista.tipo_acondicionamiento_fk || '',
        fases_fk: lista.fases_fk || '',
        forms: formsParsed
      });

      if (!memoria_tipo_acom[lineaIndex]) {
        const initialValues = {};
        formsParsed.forEach((item) => {
          initialValues[item.clave] = item.valor || '';
        });
        setMemoriaTipoAcom((prev) => {
          const actualizado = { ...prev, [lineaIndex]: initialValues };
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
    if (formRef.current.checkValidity() && lineaIndex > 0) {
      setLineaIndex((prev) => prev - 1);
    } else {
      formRef.current.reportValidity();
    }
  };

  const handleNextLine = (e) => {
    e.preventDefault();
    if (formRef.current.checkValidity() && lineaIndex < listas.length - 1) {
      setLineaIndex((prev) => prev + 1);
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
        JSON.parse(item.forms).map((form) => ({
          ...form,
          valor: memoria_tipo_acom[index]?.[form.clave] || ''
        }))
      )
    }));

    const estructura = { maestra_tipo_acom_fk: datosFinales };
    localStorage.setItem('memoria_tipo_acom', JSON.stringify(memoria_tipo_acom));
    console.log('Guardado final:', estructura);
    setTipoAcomSave(false);
    localStorage.setItem('tipo_acom_save', "guardado");
  };

  if (tipo_acom_save === false) {
    if (proms.length === 0) {
      localStorage.setItem('tipo_acom_save', "guardado");
    }

    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 border">
          <div className="text-lg font-semibold text-white bg-green-600 p-3 rounded-md">
            {proms.length === 0 ? (
              "TIPO ACONDICIONAMIENTO: No hay datos por procesar"
            ) : (
              <>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-3"
                  disabled={localStorage.getItem('tipo_acom_save') === "guardado"}
                  onClick={() => setTipoAcomSave(true)}
                >
                  Iniciar
                </button>
                {localStorage.getItem('tipo_acom_save') === "guardado"
                  ? "TIPO ACONDICIONAMIENTO: Guardado"
                  : "TIPO ACONDICIONAMIENTO"}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
        <h2 className="text-lg font-bold text-blue-700 mb-4">Información General</h2>
        <ul className="space-y-1 text-sm">
          <li><strong>ID:</strong> {fase.id}</li>
          <li><strong>Orden Ejecutada:</strong> {fase.orden_ejecutada}</li>
          <li><strong>Adaptation ID:</strong> {fase.adaptation_id}</li>
          <li><strong>Tipo Acondicionamiento:</strong> {fase.tipo_acondicionamiento_fk}</li>
          <li><strong>Fases FK:</strong> {fase.fases_fk}</li>
        </ul>
      </div>

      <form ref={formRef} onSubmit={handleFinalSubmit} className="space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6 border">
          {fase.forms.map((item, index) => {
            let config = typeof item.config === 'string' ? JSON.parse(item.config || '{}') : item.config;

            return (
              <div className="mb-4" key={`item-${index}`}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {item.descripcion_actividad}
                </label>

                {config.type === "select" ? (
                  <select
                    required={item.binding}
                    name={item.clave}
                    value={info[item.clave] || ''}
                    onChange={inputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione</option>
                    {config.options?.map((opt, i) => (
                      <option key={`opt-${index}-${i}`} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={config.type || 'text'}
                    required={item.binding}
                    name={item.clave}
                    value={info[item.clave] || ''}
                    placeholder={item.descripcion_actividad}
                    onChange={inputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleAnteriorLine}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded disabled:opacity-50"
            disabled={lineaIndex === 0}
          >
            ← Anterior
          </button>

          <button
            onClick={handleNextLine}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
            disabled={lineaIndex >= listas.length - 1}
          >
            Siguiente →
          </button>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
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
