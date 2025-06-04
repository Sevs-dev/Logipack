import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import TipoAcom from './TipoAcom';
import Fases from './Fases';

// Hook para obtener datos
const useFetchData = () => {
  const [list_data, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // funcion para obtener datos
  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/getOrdenesEjecutadas/2');
      if (!response.ok) throw new Error('Error al obtener los datos');
      const data = await response.json();
      setListData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para obtener datos
  useEffect(() => {
    fetchData();
  }, []);

  return { list_data, loading, error, reloadData: fetchData };
};

// Hook para enviar datos
const useEnviardata = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enviarData = async (data) => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/newOrdenesEjecutadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      // console.log(await response.json());
      // window.location.reload();
      if (!response.ok) throw new Error('Error al enviar los datos');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { enviarData, loading, error };
};

// componente principal
const App = () => {
  const [memoria, setMemoria] = useState([]);
  const [estado_form, setEstado_form] = useState(false);
  const [finalizado_form, setFinalizado_form] = useState(false);
  const { list_data, loading, error, reloadData } = useFetchData();
  const { enviarData, error: error_envio } = useEnviardata();

  const handleFinalSubmit = () => {
    console.log('Formulario finalizado con memoria');
    setEstado_form(true); // Marca el formulario como completado
    setFinalizado_form(true);
    // Envía los datos actualizados (incluyendo el último formulario)
    enviarData(memoria);
    console.log(memoria);
    if (error_envio) {
      console.log(error_envio);
    }
  };

  // useEffect para almacenar la primera instancia
  useEffect(() => {
    if (list_data?.acondicionamiento?.length) {
      setMemoria(list_data.acondicionamiento);
    }
  }, [list_data]);

  // renderizado de componentes
  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-danger">Error: {error}</div>;

  return (
    <>
      <div className="container py-5 w-50">
        <h2 className="mb-4">Órdenes de Acondicionamiento</h2>
        {list_data.acondicionamiento?.map((acon, index) => (
          <div className="card mb-4 shadow-sm" key={`acon-${index}`}>
            <div className="card-header bg-primary text-white">
              Orden #{acon.number_order}
            </div>
            <div className="card-body">
              <p><strong>Adaptation ID:</strong> {acon.adaptation_id}</p>
              <p><strong>Maestra ID:</strong> {acon.maestra_id}</p>
              <p><strong>Descripción Maestra:</strong> {acon.descripcion_maestra}</p>
              <p><strong>Línea Producción:</strong> {acon.linea_produccion}</p>
              <p><strong>Tipo Acondicionamiento FK:</strong> {acon.maestra_tipo_acondicionamiento_fk}</p>
              <p><strong>Fase FK:</strong> {acon.maestra_fases_fk}</p>
              <p><strong>Status Dates:</strong> {acon.status_dates}</p>
            </div>
          </div>
        ))}
      </div>

      {/* tipo de acondicionamiento */}
      <TipoAcom
        proms={list_data.maestra_tipo_acondicionamiento_fk}
        setMemoria={setMemoria}
        memoria={memoria}
        estado_form={estado_form}
        setEstado_form={setEstado_form}
      />

      {/* fases */}
      <Fases proms={list_data.maestra_fases_fk}
        setMemoria={setMemoria}
        memoria={memoria}
        estado_form={!estado_form}
        setEstado_form={setEstado_form}
        finalizado_form={finalizado_form}
        setFinalizado_form={setFinalizado_form}
      />

      {/* enviar datos */}
      <div className="container py-4 w-50" style={{ marginTop: '-50px' }}>
        <div className="card mb-5 shadow-sm">
          <div className="card-header bg-secondary text-white">
            Enviar Datos
          </div>
          <div className="card-body" style={{ textAlign: 'center', 
            display: (estado_form === false) || (finalizado_form === false || memoria.length < 2) ? 'none' : 'block' }}>
            <button
              className="btn btn-success mt-4 btn-lg"
              onClick={handleFinalSubmit}
              disabled={(estado_form === false) || (finalizado_form === false)}>
              Confirmar y enviar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;