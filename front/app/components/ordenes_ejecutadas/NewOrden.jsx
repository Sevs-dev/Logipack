import React, { useState, useEffect } from 'react';
import TipoAcom from './TipoAcom';
import Fases from './Fases';

// Configuración de la base de datos IndexedDB (debe ser consistente con Fases.js)
const DB_NAME = 'FasesDB';
const DB_VERSION = 1;
const STORE_NAME = 'fasesStore';

// Función para inicializar la base de datos (similar a Fases.js)
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject('Error al abrir IndexedDB');
    };
  });
};

// Función para guardar datos en IndexedDB
const saveToDB = async (key, data) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: key, data });
    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error al guardar en IndexedDB:', error);
  }
};

// Función para leer datos de IndexedDB
const readFromDB = async (key) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result?.data);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error al leer de IndexedDB:', error);
    return null;
  }
};

// Función para limpiar datos específicos de IndexedDB
const clearDBData = async (keys) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    if (Array.isArray(keys)) {
      keys.forEach(key => store.delete(key));
    } else {
      store.delete(keys);
    }

    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error al limpiar IndexedDB:', error);
  }
};

const useFetchData = () => {
  const [list_data, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const adaptation_id = JSON.parse(localStorage.getItem('ejecutar'));

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/procesar_orden/' + adaptation_id);
      if (!response.ok) throw new Error('Error al obtener los datos');
      const data = await response.json();

      setListData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { list_data, loading, error, reloadData: fetchData };
};

const useEnviarData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enviarData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/procesar_orden/4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acondicionamiento,
          memoria_fase,
          memoria_tipo_acom,
        }),
      });
      if (!response.ok) throw new Error('Error al enviar los datos');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { enviarData, loading, error };
};

const App = () => {
  const { list_data, loading, error } = useFetchData();
  const [acondicionamiento, setAcondicionamiento] = useState({
    id: '',
    adaptation_id: '',
    maestra_id: '',
    number_order: '',
    descripcion_maestra: '',
    maestra_fases_fk: '',
    maestra_tipo_acondicionamiento_fk: '',
    linea_produccion: '',
    proceso: '',
    estado: '',
    status_dates: ''
  });

  const [fase_save, setFaseSave] = useState(false);
  const [tipo_acom_save, setTipoAcomSave] = useState(false);
  const [saveStatus, setSaveStatus] = useState({
    fase: '',
    tipo_acom: ''
  });

  // Cargar estados iniciales desde IndexedDB
  useEffect(() => {
    const loadInitialStates = async () => {
      const faseStatus = await readFromDB('fase_save');
      const tipoAcomStatus = await readFromDB('tipo_acom_save');

      setSaveStatus({
        fase: faseStatus || '',
        tipo_acom: tipoAcomStatus || ''
      });
    };
    loadInitialStates();
    // console.log("estado de guardado");
  }, [fase_save, tipo_acom_save]);

  useEffect(() => {
    if (list_data?.acondicionamiento) {
      setAcondicionamiento(list_data.acondicionamiento);
    }
    // console.log("list_data");
  }, [list_data]);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    // const memoria_fase = await readFromDB('memoria_fase_save');
    // const memoria_tipo_acom = await readFromDB('memoria_tipo_acom_save');

    // const data = {
    //   acondicionamiento,
    //   // memoria_fase,
    //   // memoria_tipo_acom
    // };

    const confirmar = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/confirmarOrden', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(acondicionamiento),
        });
        if (!response.ok) throw new Error('Error al enviar los datos');
        const d = await response.json();
        console.log(d);
        // Limpiar solo los datos específicos en lugar de todo
        await clearDBData([
          'memoria_fase',
          'memoria_fase_save',
          'fase_save',
          'memoria_tipo_acom',
          'memoria_tipo_acom_save',
          'tipo_acom_save'
        ]);

        // setFaseSave(false);
        setTipoAcomSave(false);
        setSaveStatus({ fase: '', tipo_acom: '' });
        window.close();
      } catch (e) {
        console.log(e);
      }
    };
    await confirmar();
  };

  // Verificar estado de guardado
  const isAllSaved = saveStatus.fase === "guardado" && saveStatus.tipo_acom !== "guardado";

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
      <p className="font-bold">Error</p>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Órdenes de Acondicionamiento
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Gestión de procesos de producción
          </p>
        </div>

        {/* Order Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-500">
            <h3 className="text-lg leading-6 font-medium text-white">
              Orden #{acondicionamiento.number_order}
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {[
                { label: 'Adaptation ID', value: acondicionamiento.adaptation_id },
                { label: 'Descripción Maestra', value: acondicionamiento.descripcion_maestra },
              ].map((item, index) => (
                <div key={index} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {item.value || '-'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Components */}
        <div className="space-y-8">
          <Fases
            proms={list_data?.maestra_fases_fk}
            setFaseSave={setFaseSave}
            fase_save={fase_save}
            fase_list={acondicionamiento.maestra_fases_fk}
          />

          {/* <TipoAcom
            proms={list_data?.maestra_tipo_acondicionamiento_fk}
            setTipoAcomSave={setTipoAcomSave}
            tipo_acom_save={tipo_acom_save}
          /> */}
        </div>

        {/* Submit Section */}
        {isAllSaved && (
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-green-600 to-green-500 rounded-t-lg">
              <h3 className="text-lg leading-6 font-medium text-white">
                Confirmación Final
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="mb-6 text-gray-600">
                Verifique que toda la información es correcta antes de finalizar el proceso.
              </p>
              <button
                onClick={handleFinalSubmit}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white
                bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Finalizar y Enviar
                <svg className="ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;