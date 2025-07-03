import React, { useState, useRef, useEffect } from "react";
import Firma from "./Firma";
import Text from "../text/Text";
import Timer from "../timer/Timer";
import Button from "../buttons/buttons";
import {
  createTimer,
  getTimerEjecutadaById,
} from "../../services/timer/timerServices";
import { getStageId } from "../../services/maestras/stageServices";

// Configuración de la base de datos IndexedDB
const DB_NAME = "FasesDB";
const DB_VERSION = 1;
const STORE_NAME = "fasesStore";

// Función para inicializar la base de datos
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject("Error al abrir IndexedDB");
    };
  });
};

// Función para guardar datos en IndexedDB
const saveToDB = async (key, data) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: key, data });
    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error("Error al guardar en IndexedDB:", error);
  }
};

// Función para leer datos de IndexedDB
const readFromDB = async (key) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
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
    console.error("Error al leer de IndexedDB:", error);
    return null;
  }
};

const Fases = ({ proms, setFaseSave, fase_save, fase_list }) => {
  const formRef = useRef();
  const [lineaIndex, setLineaIndex] = useState(0);
  const [fase, setFase] = useState({
    id: "",
    orden_ejecutada: "",
    adaptation_id: "",
    tipo_acondicionamiento_fk: "",
    fases_fk: "",
    description_fase: "",
    phase_type: "",
    forms: [],
    estado_form: false,
  });

  const [memoria_fase, setMemoriaFase] = useState({});
  const [dbInitialized, setDbInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Inicializar IndexedDB y cargar datos
  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar si ya hay datos guardados
        const savedData = await readFromDB("memoria_fase");
        if (savedData) {
          setMemoriaFase(savedData);
        }

        // Verificar estado de guardado
        const status = await readFromDB("fase_save");
        setSaveStatus(status || "");

        setDbInitialized(true);
      } catch (error) {
        console.error("Error inicializando IndexedDB:", error);
      }
    };

    initialize();
  }, []);

  const listas = proms || [];
  // console.log("Lista actual:", listas);
  const lista = listas[lineaIndex] || {};
  const [timerData, setTimerData] = useState(null);
  const [timerReady, setTimerReady] = useState(false);
  // Extrae solo la fase tipo "Procesos"
  const faseEnProceso = listas.find(
    (lista) => lista?.phase_type === "Procesos"
  );
  const faseEnControl = listas.find((lista) => lista?.phase_type === "Control");

  // Lógica principal: crear y cargar el timer
  useEffect(() => {
    const guardarTimer = async () => {
      if (
        !faseEnProceso ||
        !faseEnProceso.adaptation_id ||
        !faseEnProceso.fases_fk
      ) {
        console.warn("⛔ No hay fase 'Procesos' válida.");
        return;
      }

      try {
        const stage = await getStageId(faseEnProceso.fases_fk);
        let controlStageId = null;

        if (faseEnControl?.fases_fk) {
          const controlStage = await getStageId(faseEnControl.fases_fk);
          if (controlStage?.id) {
            controlStageId = controlStage.id;
          }
        }

        if (!stage?.id) return;

        const ejecutadaId = Number(faseEnProceso.id);
        if (!Number.isFinite(ejecutadaId) || ejecutadaId <= 0) return;

        const time = Number(stage.repeat_minutes ?? 0);

        const createResult = await createTimer({
          ejecutada_id: ejecutadaId,
          stage_id: stage.id,
          control_id: controlStageId,
          orden_id: faseEnProceso.orden_ejecutada,
          time,
        });

        if (createResult?.exists) {
          // console.log("⚠️ Timer ya existía para:", ejecutadaId);
        }

        const timerResult = await getTimerEjecutadaById(ejecutadaId);

        if (
          timerResult?.timer &&
          timerResult.timer.id > 0 &&
          timerResult.timer.stage_id > 0 &&
          timerResult.timer.ejecutada_id === ejecutadaId
        ) {
          setTimerData({
            ejecutadaId,
            stageId: stage.id,
            initialMinutes: Number(timerResult.timer.time),
          });
          setTimerReady(true);
        } else {
          setTimerData(null);
          setTimerReady(false);
        }
      } catch (err) {
        console.error("❌ Error en guardarTimer:", err);
        setTimerData(null);
        setTimerReady(false);
      }
    };

    guardarTimer();
  }, [listas]);

  const refetchTimer = async () => {
    if (!faseEnProceso) return;

    const stage = await getStageId(faseEnProceso.fases_fk);
    if (!stage?.id) return;

    const ejecutadaId = Number(faseEnProceso.id);
    if (!Number.isFinite(ejecutadaId) || ejecutadaId <= 0) return;

    const timerResult = await getTimerEjecutadaById(ejecutadaId);

    if (
      timerResult?.timer &&
      timerResult.timer.id > 0 &&
      timerResult.timer.stage_id > 0 &&
      timerResult.timer.ejecutada_id === ejecutadaId
    ) {
      setTimerData({
        ejecutadaId,
        stageId: stage.id,
        initialMinutes: Number(
          timerResult.timer.pause_time ?? timerResult.timer.time
        ),
      });
      setTimerReady(true);
    } else {
      setTimerData(null);
      setTimerReady(false);
    }
  };

  const info = memoria_fase[lineaIndex] || {};

  useEffect(() => {
    if (!dbInitialized || !lista || !lista.forms) return;

    let formsParsed = [];
    try {
      formsParsed = JSON.parse(lista.forms);
    } catch (e) {
      console.warn("Error al parsear forms:", e);
    }

    setFase({
      id: lista.id || "",
      orden_ejecutada: lista.orden_ejecutada || "",
      adaptation_id: lista.adaptation_id || "",
      tipo_acondicionamiento_fk: lista.tipo_acondicionamiento_fk || "",
      fases_fk: lista.fases_fk || "",
      description_fase: lista.description_fase || "",
      phase_type: lista.phase_type || "",
      forms: formsParsed,
    });

    // Solo inicializar si no existe ya
    if (!memoria_fase[lineaIndex]) {
      const initialValues = {};
      formsParsed.forEach((item) => {
        initialValues[item.clave] = item.valor || "";
      });

      setMemoriaFase((prev) => {
        const actualizado = {
          ...prev,
          [lineaIndex]: initialValues,
        };
        saveToDB("memoria_fase", actualizado);
        return actualizado;
      });
    }
  }, [lineaIndex, lista, dbInitialized]);

  const inputChange = (e) => {
    const { name, value } = e.target;
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

  const handleAnteriorLine = (e) => {
    e.preventDefault();
    if (formRef.current.checkValidity()) {
      if (lineaIndex > 0) setLineaIndex((prev) => prev - 1);
    } else {
      formRef.current.reportValidity();
    }
  };

  const handleNextLine = async (e) => {
    // e.preventDefault();
    if (formRef.current.checkValidity()) {
      if (lineaIndex < listas.length - 1) {
        const nextLine = async () => {
          try {
            lista.forms = JSON.stringify(
              JSON.parse(lista.forms).map((form) => ({
                ...form,
                valor: memoria_fase[lineaIndex]?.[form.clave] || "",
              }))
            );
            const response = await fetch(
              "http://127.0.0.1:8000/api/next_line",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(lista),
              }
            );
            if (!response.ok) throw new Error("Error al enviar los datos");
            const data = await response.json();
            console.log(data);
            setLineaIndex((prev) => prev + 1);
          } catch (e) {
            console.log(e);
          }
        };
        await nextLine();
      }
    } else {
      formRef.current.reportValidity();
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    const nextLine = async () => {
      try {
        lista.forms = JSON.stringify(
          JSON.parse(lista.forms).map((form) => ({
            ...form,
            valor: memoria_fase[lineaIndex]?.[form.clave] || "",
          }))
        );
        const response = await fetch("http://127.0.0.1:8000/api/next_line", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lista),
        });
        if (!response.ok) throw new Error("Error al enviar los datos");
        const data = await response.json();
        console.log(data);
        await saveToDB("fase_save", "guardado");
        setSaveStatus("guardado");
        setFaseSave(false);
      } catch (e) {
        console.log(e);
      }
    };
    await nextLine();

    // const datosFinales = listas.map((item, index) => ({
    //   id: item.id,
    //   orden_ejecutada: String(item.orden_ejecutada),
    //   adaptation_id: String(item.adaptation_id),
    //   tipo_acondicionamiento_fk: String(item.tipo_acondicionamiento_fk),
    //   fases_fk: String(item.fases_fk),
    //   description_fase: String(item.description_fase),
    //   phase_type: String(item.phase_type),
    //   forms: JSON.stringify(
    //     JSON.parse(item.forms).map((form) => ({
    //       ...form,
    //       valor: memoria_fase[index]?.[form.clave] || ''
    //     }))
    //   )
    // }));

    // const estructura = { maestra_fases_fk: datosFinales };

    // await saveToDB('memoria_fase', memoria_fase);
    // await saveToDB('memoria_fase_save', estructura);
  };

  if (fase_save === false) {
    if (proms.length === 0) {
      saveToDB("fase_save", "guardado");
      setSaveStatus("guardado");
    }
    return (
      <div className="max-w-2xl mx-auto my-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {saveStatus === "guardado"
                  ? "Orden ejecutada"
                  : "Ejecutar orden (" +
                    fase.id +
                    " - " +
                    fase.description_fase +
                    ")"}
              </span>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium shadow-sm ${
                  saveStatus === "guardado"
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={saveStatus === "guardado"}
                onClick={() => {
                  setFaseSave(true);
                }}
              >
                {saveStatus === "guardado" ? "Completado" : "Iniciar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-6 md:p-10 space-y-8">
      {/* Información General */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-5 rounded-xl shadow">
        <Text type="title" color="text-[#ffff]">
          Fase de {fase.description_fase} ({fase.phase_type})
        </Text>
      </div>
      {!timerReady || !timerData ? (
        <div className="text-center text-sm text-gray-600 animate-pulse py-4">
          ⏳ Cargando datos del temporizador...
        </div>
      ) : (
        <Timer
          ejecutadaId={timerData.ejecutadaId}
          stageId={timerData.stageId}
          initialMinutes={timerData.initialMinutes}
          refetchTimer={refetchTimer}
        />
      )}

      {/* Formulario */}
      <form ref={formRef} onSubmit={handleFinalSubmit} className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-6">
          {fase.forms.map((item, index) => {
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
            return (
              <div key={`item-${index}`} className="space-y-2">
                <Text type="subtitle" color="#000">
                  {item.descripcion_activitie}
                </Text>
                {/* Componentes */}
                {type === "select" && (
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 
                        rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    name={item.clave}
                    value={info[item.clave] ?? ""}
                    required={item.binding}
                    onChange={inputChange}
                  >
                    <option value="">Seleccione</option>
                    {options.map((opt, k) => (
                      <option key={`opt-${k}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
                {type === "file" && (
                  <div>
                    {info[item.clave]?.startsWith("data:application/pdf") && (
                      <div className="mb-2">
                        <object
                          data={info[item.clave]}
                          type="application/pdf"
                          width="100%"
                          height="400px"
                        >
                          <p className="text-gray-600">
                            No se pudo mostrar el PDF.{" "}
                            <a
                              href={info[item.clave]}
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      type="file"
                      accept="application/pdf"
                      required={
                        info[item.clave]?.startsWith("data:application/pdf")
                          ? false
                          : item.binding
                      }
                      name={item.clave}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result;
                            setMemoriaFase((prev) => {
                              const actualizado = {
                                ...prev,
                                [lineaIndex]: {
                                  ...prev[lineaIndex],
                                  [item.clave]: base64,
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
                {type === "image" && (
                  <div>
                    {info[item.clave]?.startsWith("data:image") && (
                      <div className="mb-2">
                        <img
                          src={info[item.clave]}
                          alt="Imagen guardada"
                          className="max-h-48 rounded shadow object-contain"
                        />
                      </div>
                    )}

                    <input
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      type="file"
                      accept="image/*"
                      required={
                        info[item.clave]?.startsWith("data:image")
                          ? false
                          : item.binding
                      }
                      name={item.clave}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result;
                            setMemoriaFase((prev) => {
                              const actualizado = {
                                ...prev,
                                [lineaIndex]: {
                                  ...prev[lineaIndex],
                                  [item.clave]: base64,
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
                {type === "number" && (
                  <input
                    type="number"
                    className="block w-full px-3 py-2 border border-gray-300 
                        rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    placeholder={item.descripcion_activitie}
                    name={item.clave}
                    value={info[item.clave] ?? ""}
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
                    value={info[item.clave] ?? ""}
                    required={item.binding}
                    onChange={inputChange}
                  />
                )}
                {type === "radio" &&
                  options.map((option, idx) => (
                    <label key={idx} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={item.clave}
                        value={option}
                        required={item.binding}
                        checked={info[item.clave] === option}
                        onChange={(e) => {
                          const { value } = e.target;
                          setMemoriaFase((prev) => {
                            const actualizado = {
                              ...prev,
                              [lineaIndex]: {
                                ...prev[lineaIndex],
                                [item.clave]: value,
                              },
                            };
                            saveToDB("memoria_fase", actualizado);
                            return actualizado;
                          });
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="block text-sm font-medium text-gray-700">
                        {option}
                      </span>
                    </label>
                  ))}
                {type === "checkbox" &&
                  options.map((option, idx) => (
                    <label key={idx} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={item.clave}
                        required={
                          item.binding &&
                          (!Array.isArray(info[item.clave]) ||
                            info[item.clave].length === 0)
                        }
                        checked={
                          Array.isArray(info[item.clave]) &&
                          info[item.clave].includes(option)
                        }
                        onChange={(e) => {
                          const { checked } = e.target;
                          setMemoriaFase((prev) => {
                            const prevArr = Array.isArray(
                              prev[lineaIndex]?.[item.clave]
                            )
                              ? prev[lineaIndex][item.clave]
                              : [];
                            const newArr = checked
                              ? [...prevArr, option]
                              : prevArr.filter((val) => val !== option);
                            const actualizado = {
                              ...prev,
                              [lineaIndex]: {
                                ...prev[lineaIndex],
                                [item.clave]: newArr,
                              },
                            };
                            saveToDB("memoria_fase", actualizado);
                            return actualizado;
                          });
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="block text-sm font-medium text-gray-700">
                        {option}
                      </span>
                    </label>
                  ))}
                {type === "signature" && (
                  <Firma
                    type={type}
                    item={item}
                    info={info}
                    lineaIndex={lineaIndex}
                    setMemoriaGeneral={setMemoriaFase}
                    saveToDB={saveToDB}
                    typeMem="memoria_fase"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between mt-4">
          <Button
            onClick={handleAnteriorLine}
            disabled={lineaIndex === 0}
            label="Actividad Anterior"
            variant="before"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          />

          <Button
            onClick={handleNextLine}
            disabled={lineaIndex >= listas.length - 1}
            label="Siguiente Fase                 "
            variant="after"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <Button
            type="submit"
            label="Finalizar y confirmar"
            disabled={lineaIndex !== listas.length - 1}
            variant="save"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          />
        </div>
      </form>
    </div>
  );
};

export default Fases;
