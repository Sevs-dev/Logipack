import React, { useState, useEffect } from 'react'; 
import Fases from './Fases';
import Text from "../text/Text";
import Button from "../buttons/buttons";

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
    // e.preventDefault();
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

    console.log('Formulario finalizado con memoria:', data);

    // Limpiar solo los datos específicos en lugar de todo
    await clearDBData([
      'memoria_fase',
      'memoria_fase_save',
      'fase_save',
      'memoria_tipo_acom',
      'memoria_tipo_acom_save',
      'tipo_acom_save'
    ]);

    setFaseSave(false);
    setTipoAcomSave(false);
    setSaveStatus({ fase: '', tipo_acom: '' });
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
    <div className="w-full bg-white border rounded-sm p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-wrap justify-center md:justify-between items-center mb-10 gap-4">
        <Text type="title" color="#000">
          Orden #{acondicionamiento.number_order}
        </Text>

        {/* Order Card */}
        <div className="inline-flex items-start gap-4 bg-white rounded-xl border border-gray-200 shadow p-4">
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
            {[{ label: 'Descripción Maestra', value: acondicionamiento.descripcion_maestra }][0].label.charAt(0)}
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-600 mb-1">
              Descripción Maestra
            </dt>
            <dd className="text-sm text-gray-900">
              {acondicionamiento.descripcion_maestra || (
                <span className="text-gray-400 italic">Sin descripción</span>
              )}
            </dd>
          </div>
        </div>
      </div>

      {/* Fases Component */}
      <div className="mb-10">
        <Fases
          proms={list_data?.maestra_fases_fk}
          setFaseSave={setFaseSave}
          fase_save={fase_save}
          fase_list={acondicionamiento.maestra_fases_fk}
        />
      </div>

      {/* Confirmation Section */}
      {isAllSaved && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-8 shadow-md text-center transition-all transform hover:shadow-lg duration-300">
          <h3 className="text-2xl font-bold text-green-600">Confirmación Final</h3>
          <p className="mt-3 text-gray-600">
            Verifique que toda la información es correcta antes de finalizar el proceso.
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <Button
              onClick={() => handleFinalSubmit()}
              variant="save"
              label="Finalizar y Enviar"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;