import { useEffect, useRef, useState } from "react";
import Text from "../text/Text";
import { showError } from "../toastr/Toaster";
import { siguiente_fase, guardar_formulario, validate_orden } from "@/app/services/planing/planingServices";

// Configuración de la base de datos IndexedDB
const DB_NAME = "FasesDB";
const DB_VERSION = 1;
const STORE_NAME = "fasesStore";

// Inicializar la base de datos
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => reject("Error al abrir IndexedDB");
  });
};

// Guardar en IndexedDB
const saveToDB = async (key, data) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: key, data });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error("Error al guardar en IndexedDB:", error);
  }
};

// Leer desde IndexedDB
const readFromDB = async (key) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error("Error al leer de IndexedDB:", error);
    return null;
  }
};

// Función para limpiar todo el contenido del Object Store
const clearDB = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject("Error al limpiar IndexedDB");
      tx.oncomplete = () => console.log("Limpieza completada");
    });
  } catch (error) {
    console.error("Error al limpiar IndexedDB:", error);
    throw error;
  }
};

const App = () => {
  const formRef = useRef(null);
  const [local, setLocal] = useState(null);
  const [fase, setFase] = useState(null);
  const [sig, setSig] = useState(0);
  const [memoriaFase, setMemoriaFase] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    try {
      const data = localStorage.getItem("ejecutar");
      if (data) setLocal(JSON.parse(data));
    } catch (error) {
      showError("Datos inválidos en el almacenamiento local.");
    }
  }, []);

  // Cargar memoria fase desde IndexedDB
  useEffect(() => {
    const cargarMemoria = async () => {
      const memoria = await readFromDB("memoria_fase");
      if (memoria) setMemoriaFase(memoria);
    };
    cargarMemoria();
  }, []);

  // Obtener la siguiente fase
  useEffect(() => {
    if (!local?.id || !local.linea || !local.tipo) return;

    const cargarFase = async () => {
      try {
        const resp = await siguiente_fase(local.id, local.linea, local.tipo);
        setFase(resp.fases);
      } catch (error) {
        showError("No se pudo obtener la fase.");
      }
    };

    cargarFase();
  }, [local, sig]);

  // Manejador de cambio de inputs
  const inputChange = (e) => {
    const { name, value } = e.target;
    const lineaIndex = local.linea;

    setMemoriaFase((prev) => {
      const actualizado = {
        ...prev,
        [lineaIndex]: {
          ...prev[lineaIndex],
          [name]: value,
        },
      };
      saveToDB("memoria_fase", actualizado);
      return actualizado;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fase || !memoriaFase[linea]) {
      showError("No hay datos disponibles para procesar.");
      return;
    }

    const datosLinea = memoriaFase[linea];

    // Recorremos cada form original y le agregamos el valor correspondiente
    const formsParsed = JSON.parse(fase.forms).map((form) => ({
      ...form,
      valor: datosLinea[form.clave] ?? "", // si no tiene valor, se deja vacío
    }));

    const resultado = {
      id: fase.id || "",
      orden_ejecutada: fase.orden_ejecutada || "",
      adaptation_date_id: fase.adaptation_date_id || "",
      adaptation_id: fase.adaptation_id || "",
      fases_fk: fase.fases_fk || "",
      description_fase: fase.description_fase || "",
      phase_type: fase.phase_type || "",
      forms: formsParsed,
      user: local.user,
    };

    const resp = await guardar_formulario(resultado);
    if (resp.estado === 200) {
      localStorage.removeItem("ejecutar");
      // limpiar indexedDB
      clearDB();
      setSig((prev) => prev + 1);
    }
  };

  // Mostrar mensaje si no hay datos
  if (!local || !local.orden) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white text-xl font-semibold">
          No hay datos de la orden
        </p>
      </div>
    );
  }

  // si no hay fase
  if (!fase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-4">
        <p className="text-white text-xl font-semibold">
          Fase finalizada.
        </p>
        <button
          className="w-20 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors"
          onClick={async () => {
            await validate_orden(local.id);
            window.close();
          }}>
          Cerrar
        </button>
      </div>
    );
  }

  // obtener formularios
  let forms = [];
  try {
    forms = JSON.parse(fase?.forms || "[]");
  } catch {
    showError("El formato de los formularios es inválido.");
  }

  // Información de la orden y linea
  const orden = local.orden;
  const linea = local.linea;

  if (!memoriaFase[linea]) {
    const dba = JSON.parse(fase.forms);
    dba.map((item) => {
      memoriaFase[linea] = {
        ...memoriaFase[linea],
        [item.clave]: item.valor,
      };
    });
  }
  return (
    <>
      {/* Información de la orden */}
      <div className="mb-6 p-4 bg-white shadow rounded-xl border">
        <p className="text-gray-700"><span className="font-semibold">Orden N°:</span> {orden?.number_order}</p>
        <p className="text-gray-700"><span className="font-semibold">Descripción:</span> {orden?.descripcion_maestra}</p>
        <p className="text-gray-700"><span className="font-semibold">Proceso:</span> {orden?.proceso}</p>
        <p className="text-gray-700"><span className="font-semibold">Línea:</span> {linea} ({local.descripcion})</p>
        <p className="text-gray-700"><span className="font-semibold">Estado:</span> {orden?.estado}</p>
      </div>

      {/* Fase */}
      <div className="mb-6 p-4 bg-white shadow rounded-xl border">
        <div className="w-full border border-gray-200 rounded-xl p-6 md:p-10 space-y-8">
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-5 rounded-xl shadow">
            <Text type="title" color="text-[#ffff]">
              Fase de {fase?.description_fase} ({fase?.phase_type})
            </Text>
          </div>

          {/* Formulario */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-6">
              <div className="space-y-4">
                {forms.map((item, index) => {
                  // obtener tipo de actividad
                  let config = item.config;
                  try {
                    if (typeof config === "string") {
                      config = JSON.parse(config);
                    }

                    if (typeof config === "string") {
                      config = JSON.parse(config);
                    }
                  } catch (error) {
                    config = {};
                  }
                  const { type, options } = config;
                  const clave = item.clave;
                  return (
                    <div key={index}>
                      <Text type="title" color="text-[#ffff]">
                        {item.descripcion_activitie}
                      </Text>

                      {/* TEXT */}
                      {type === "text" && (
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          placeholder={item.descripcion_activitie}
                          name={clave}
                          value={memoriaFase[linea]?.[clave] ?? ""}
                          required={item.binding}
                          onChange={inputChange}
                        />
                      )}

                      {/* NUMBER */}
                      {type === "number" && (
                        <input
                          type="number"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          placeholder={item.descripcion_activitie}
                          name={clave}
                          value={memoriaFase[linea]?.[clave] ?? ""}
                          required={item.binding}
                          onChange={inputChange}
                        />
                      )}

                      {/* DATE */}
                      {type === "date" && (
                        <input
                          type="date"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          name={clave}
                          value={memoriaFase[linea]?.[clave] ?? ""}
                          required={item.binding}
                          onChange={inputChange}
                        />
                      )}

                      {/* TIME */}
                      {type === "time" && (
                        <input
                          type="time"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          name={clave}
                          value={memoriaFase[linea]?.[clave] ?? ""}
                          required={item.binding}
                          onChange={inputChange}
                        />
                      )}

                      {/* SELECT */}
                      {type === "select" && (
                        <select
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          name={clave}
                          value={memoriaFase[linea]?.[clave] ?? ""}
                          required={item.binding}
                          onChange={inputChange}>
                          <option value="">Seleccione</option>
                          {options.map((opt, k) => (
                            <option key={`opt-${k}`} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* RADIO */}
                      {type === "radio" && options.map((opt, idx) => (
                        <label key={idx} className="inline-flex items-center gap-2 mr-4">
                          <input
                            type="radio"
                            name={clave}
                            value={opt}
                            required={item.binding}
                            checked={memoriaFase[linea]?.[clave] === opt}
                            onChange={inputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}

                      {/* CHECKBOX */}
                      {type === "checkbox" && options.map((opt, idx) => (
                        <label key={idx} className="inline-flex items-center gap-2 mr-4">
                          <input
                            type="checkbox"
                            name={clave}
                            required={
                              item.binding &&
                              (!Array.isArray(memoriaFase[linea]?.[clave]) ||
                                memoriaFase[linea][clave].length === 0)
                            }
                            checked={
                              Array.isArray(memoriaFase[linea]?.[clave]) &&
                              memoriaFase[linea][clave].includes(opt)
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setMemoriaFase((prev) => {
                                const prevArr = Array.isArray(prev[linea]?.[clave])
                                  ? prev[linea][clave]
                                  : [];
                                const newArr = checked
                                  ? [...prevArr, opt]
                                  : prevArr.filter((val) => val !== opt);
                                const actualizado = {
                                  ...prev,
                                  [linea]: {
                                    ...prev[linea],
                                    [clave]: newArr,
                                  },
                                };
                                saveToDB("memoria_fase", actualizado);
                                return actualizado;
                              });
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}

                      {/* FILE (PDF) */}
                      {type === "file" && (
                        <div>
                          {memoriaFase[linea]?.[clave]?.startsWith("data:application/pdf") && (
                            <div className="mb-2">
                              <object
                                data={memoriaFase[linea][clave]}
                                type="application/pdf"
                                width="100%"
                                height="400px"
                              >
                                <p className="text-gray-600">
                                  No se pudo mostrar el PDF.{" "}
                                  <a
                                    href={memoriaFase[linea][clave]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    Haz clic aquí para verlo
                                  </a>
                                </p>
                              </object>
                            </div>
                          )}

                          <input
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            type="file"
                            accept="application/pdf"
                            required={
                              !memoriaFase[linea]?.[clave]?.startsWith("data:application/pdf") &&
                              item.binding
                            }
                            name={clave}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = reader.result;
                                  setMemoriaFase((prev) => {
                                    const actualizado = {
                                      ...prev,
                                      [linea]: {
                                        ...prev[linea],
                                        [clave]: base64,
                                      },
                                    };
                                    saveToDB("memoria_fase", actualizado);
                                    return actualizado;
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* IMAGE */}
                      {type === "image" && (
                        <div>
                          {memoriaFase[linea]?.[clave]?.startsWith("data:image") && (
                            <div className="mb-2">
                              <img
                                src={memoriaFase[linea][clave]}
                                alt="Imagen guardada"
                                className="max-h-48 rounded shadow object-contain"
                              />
                            </div>
                          )}

                          <input
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            type="file"
                            accept="image/*"
                            required={
                              !memoriaFase[linea]?.[clave]?.startsWith("data:image") &&
                              item.binding
                            }
                            name={clave}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = reader.result;
                                  setMemoriaFase((prev) => {
                                    const actualizado = {
                                      ...prev,
                                      [linea]: {
                                        ...prev[linea],
                                        [clave]: base64,
                                      },
                                    };
                                    saveToDB("memoria_fase", actualizado);
                                    return actualizado;
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* SIGNATURE */}
                      {type === "signature" && (
                        <Firma
                          type={type}
                          item={item}
                          info={memoriaFase[linea]}
                          lineaIndex={linea}
                          setMemoriaGeneral={setMemoriaFase}
                          saveToDB={saveToDB}
                          typeMem="memoria_fase"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 
              rounded-xl hover:bg-blue-700 transition-colors">
              Siguiente Fase
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default App;
