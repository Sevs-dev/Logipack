import { useEffect, useRef, useState } from "react";
import {
  siguiente_fase,
  guardar_formulario,
  validate_orden,
  fase_control,
  condiciones_fase,
  validate_rol,
} from "@/app/services/planing/planingServices";
import { getAdaptationsId } from "@/app/services/adaptation/adaptationServices";
import { getMaestraId } from "../../services/maestras/maestraServices";
import {
  createTimer,
  getTimerEjecutadaById,
} from "../../services/timer/timerServices";
import {
  getStageId,
  controlStage,
} from "../../services/maestras/stageServices";
import Firma from "../ordenes_ejecutadas/Firma";
import ModalBlock from "../modal/ModalBlock";

import Text from "../text/Text";
import { showError } from "../toastr/Toaster";
import Timer from "../timer/Timer";
import DateLoader from "@/app/components/loader/DateLoader";
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
      // tx.oncomplete = () => console.log("Limpieza completada");
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
  const [timerData, setTimerData] = useState(null);
  const [timerReady, setTimerReady] = useState(false);
  const [showModal_rol, setShowModal_rol] = useState(false);
  const [showModal_fase, setShowModal_fase] = useState(false);
  const isProceso =
    typeof fase?.phase_type === "string" &&
    fase.phase_type.toLowerCase().includes("proceso"); // "Proceso" o "Procesos"
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
        // console.log(local);
        const resp = await siguiente_fase(local.id, local.linea, local.tipo);
        console.log(resp);
        // console.log(resp);
        setFase(resp.fases);
      } catch (error) {
        showError("No se pudo obtener la fase.");
      }
    };

    cargarFase();
  }, [local, sig]);

  // Lógica principal: crear y cargar el timer
  useEffect(() => {
    const guardarTimer = async () => {
      if (!fase) return;
      try {
        const adaptation = await controlStage(fase.adaptation_id);
        if (!adaptation?.id) return;

        const ejecutadaId = Number(fase.id);
        if (!Number.isFinite(ejecutadaId) || ejecutadaId <= 0) return;

        const time = Number(adaptation.repeat_minutes ?? 0);
        const createResult = await createTimer({
          ejecutada_id: ejecutadaId,
          stage_id: adaptation?.id,
          control_id: adaptation?.id,
          orden_id: fase.orden_ejecutada,
          time,
        });

        const timerResult = await getTimerEjecutadaById(ejecutadaId);
        if (
          timerResult?.timer &&
          timerResult.timer.id > 0 &&
          timerResult.timer.stage_id > 0 &&
          timerResult.timer.ejecutada_id === ejecutadaId
        ) {
          setTimerData({
            ejecutadaId,
            stageId: adaptation.id,
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

    const condicionFase = async () => {
      if (!fase) return;
      const resp = await condiciones_fase(
        fase.adaptation_date_id,
        fase.fases_fk
      );

      const rawPerfil = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1];
      const perfil = rawPerfil
        ? decodeURIComponent(rawPerfil).replace(/"/g, "").trim()
        : "";

      const isPrivileged = ["administrador", "master"].includes(
        perfil.toLowerCase()
      );
      if (isPrivileged) {
        setShowModal_rol(false);
        setShowModal_fase(resp.condicion_1 > 0);
        return;
      }

      const { roles } = await validate_rol(fase.fases_fk);
      const tienePermiso = roles?.role
        ?.toString()
        .split(",")
        .map((r) => r.trim().toLowerCase())
        .some((r) => r === perfil.toLowerCase());
      setShowModal_rol(!tienePermiso);
      setShowModal_fase(resp.condicion_1 > 0);
    };

    condicionFase();

    // 🔒 Timer solo para Procesos
    if (isProceso) {
      guardarTimer();
    } else {
      // Asegura que no muestre loader ni timer en fases NO-Procesos
      setTimerData(null);
      setTimerReady(false);
    }
  }, [fase]);

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
      // localStorage.removeItem("ejecutar");
      // limpiar indexedDB
      clearDB();
      setSig((prev) => prev + 1);
    }
  };

  // Mostrar mensaje si no hay datos
  if (!local || !local.orden) {
    return (
      <DateLoader
        message=" No hay datos de la orden o líneas de procesos"
        backgroundColor="#111827"
        color="#ffff"
      />
    );
  }

  // si no hay fase
  if (!fase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-4">
        <DateLoader
          message="Fase finalizada."
          backgroundColor="#111827"
          color="#ffff"
        />
        <button
          className="w-20 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors"
          onClick={async () => {
            await validate_orden(local.id);
            // window.close();
            console.log(localStorage);
            window.open("/pages/lineas", "_self");
          }}
        >
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

  const refetchTimer = async () => {
    if (!fase || !isProceso) return; // 👈 evita recargar timer en fases no-Procesos

    const stage = await getStageId(fase.fases_fk);
    if (!stage?.id) return;

    const ejecutadaId = Number(fase.id);
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

  return (
    <>
      {/* Timer */}
      <>
        <ModalBlock
          isOpen={showModal_rol}
          onClose={() => setShowModal_rol(false)}
          message="Tu acceso está bloqueado temporalmente. Contacta al administrador."
        />

        {/* Contenido principal */}
        <ModalBlock
          isOpen={showModal_fase}
          onClose={() => setShowModal_fase(false)}
          message="Fase bloqueado temporalmente. Contacta al administrador."
        />
      </>
      {/* 🔔 TIMER SOLO EN PROCESOS */}
      {isProceso && (!timerReady || !timerData) && (
        <DateLoader
          message="Cargando datos del temporizador..."
          backgroundColor="#111827"
          color="#ffff"
        />
      )}

      {isProceso && timerReady && timerData && linea !== "0" && (
        <Timer
          ejecutadaId={timerData.ejecutadaId}
          stageId={timerData.stageId}
          initialMinutes={timerData.initialMinutes}
          refetchTimer={refetchTimer}
        />
      )}

      {/* 🔽 Contenido principal SIEMPRE visible */}
      <div className="min-h-screen w-full bg-[#1b2535] text-white p-3 sm:p-4 md:p-[10px] flex flex-col rounded-2xl">
        <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden">
          <div className="bg-white/5 px-3 sm:px-[10px] py-3 sm:py-[10px] border-b border-white/10 backdrop-blur-sm">
            <Text type="title" color="text-white">
              Información de la Orden
            </Text>
          </div>
          <div
            className="
                  px-3 sm:px-6 md:px-8 py-4 sm:py-6
                  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6
                  gap-3 sm:gap-4 text-sm text-gray-200
                "
          >
            <div>
              <p className="text-gray-500 text-center">Orden N°</p>
              <p className="font-medium text-gray-200 text-center">
                {orden?.number_order}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-center">Cliente</p>
              <p className="font-medium text-gray-200 text-center">
                {orden?.cliente}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-center">Planta</p>
              <p className="font-medium text-gray-200 text-center">
                {orden?.planta}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-center">Maestra</p>
              <p className="font-medium text-gray-200 text-center">
                {orden?.descripcion_maestra}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-center">Línea</p>
              <p className="font-medium text-gray-200 text-center">
                {linea} ({local.descripcion})
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-center">Cantidad a producir</p>
              <p className="font-medium text-gray-200 text-center">
                {orden?.cantidad_producir}
              </p>
            </div>
          </div>
        </div>
        {/* Fase */}
        <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden mt-4">
          <div className="bg-white/2.5 px-[10px] py-[10px] border-b border-white/5 backdrop-blur-sm">
            <Text type="title" color="text-white">
              Fase de {fase?.description_fase} ({fase?.phase_type})
            </Text>
          </div>
          {/* Formulario */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="min-h-screen w-full bg-[#1b2535] text-white p-[10px] sm:p-[10px] flex flex-col rounded-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                const { type, options, min, max, items, signatureSpecific } =
                  config;
                const clave = item.clave;
                return (
                  <div key={index}>
                    <Text type="subtitle" color="text-white">
                      {item.descripcion_activitie}
                    </Text>

                    {/* MUESTREO */}
                    {type === "muestreo" && (
                      <p className="text-red-500">
                        {items.map(({ min, max, valor }) => {
                          if (
                            min <= orden.cantidad_producir &&
                            orden.cantidad_producir <= max
                          ) {
                            return valor;
                          }
                        })}
                      </p>
                    )}

                    {/* TEXT */}
                    {type === "text" && (
                      <input
                        type="text"
                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
                        required={item.binding}
                        onChange={inputChange}
                      />
                    )}
                    {/* TEXTAREA */}

                    {type === "textarea" && (
                      <textarea
                        rows={1}
                        style={{ maxHeight: "15rem" }}
                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
                        required={item.binding}
                        onChange={(e) => {
                          e.target.style.height = "auto"; // Reinicia el alto
                          e.target.style.height = `${e.target.scrollHeight}px`; // Ajusta al contenido
                          inputChange(e);
                        }}
                      />
                    )}

                    {/* NUMBER */}
                    {type === "number" && (
                      <input
                        type="number"
                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
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
                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
                        required={item.binding}
                        onChange={inputChange}
                        style={{
                          colorScheme: "dark",
                          WebkitCalendarPickerIndicator: {
                            filter: "invert(1)",
                          },
                        }}
                      />
                    )}

                    {/* TIME */}
                    {type === "time" && (
                      <input
                        type="time"
                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
                        required={item.binding}
                        onChange={inputChange}
                      />
                    )}

                    {/* SELECT */}
                    {type === "select" && (
                      <select
                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
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

                    {/* RADIO */}
                    {type === "radio" && (
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {options.map((opt) => {
                          const isSelected =
                            memoriaFase[linea]?.[clave] === opt;

                          return (
                            <label
                              key={opt}
                              className={`relative flex cursor-pointer items-center justify-between rounded-lg border p-4 shadow-sm transition-all duration-200 ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500"
                                  : "border-gray-300 bg-white/10 hover:bg-gray-50"
                              }`}
                            >
                              {/* Input accesible pero oculto visualmente */}
                              <input
                                className="sr-only"
                                type="radio"
                                name={clave}
                                value={opt}
                                required={item.binding}
                                checked={isSelected}
                                onChange={inputChange}
                              />

                              <span
                                className={`flex-1 text-sm font-medium text-center ${
                                  isSelected
                                    ? "text-indigo-900"
                                    : "text-gray-400"
                                }`}
                              >
                                {opt}
                              </span>

                              {isSelected && (
                                <svg
                                  className="h-5 w-5 text-indigo-600"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* CHECKBOX */}
                    {type === "checkbox" && (
                      <div className="flex justify-center flex-wrap gap-4 mt-2">
                        {options.map((opt, idx) => (
                          <label
                            key={idx}
                            className="flex items-center gap-2 text-white"
                          >
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
                                  const prevArr = Array.isArray(
                                    prev[linea]?.[clave]
                                  )
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
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* FILE (PDF) */}
                    {type === "file" && (
                      <div>
                        {memoriaFase[linea]?.[clave]?.startsWith(
                          "data:application/pdf"
                        ) && (
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
                          className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                          type="file"
                          accept="application/pdf"
                          required={
                            !memoriaFase[linea]?.[clave]?.startsWith(
                              "data:application/pdf"
                            ) && item.binding
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
                        {memoriaFase[linea]?.[clave]?.startsWith(
                          "data:image"
                        ) && (
                          <div className="mb-2 justify-center flex">
                            <img
                              src={memoriaFase[linea][clave]}
                              alt="Imagen guardada"
                              className="max-h-48 rounded shadow object-contain"
                            />
                          </div>
                        )}

                        <input
                          className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md 
                          shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                          focus:border-blue-500 text-white placeholder-gray-400 text-center"
                          type="file"
                          accept="image/*"
                          required={
                            !memoriaFase[linea]?.[clave]?.startsWith(
                              "data:image"
                            ) && item.binding
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
                      <>
                        <select
                          className="text-center last:block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 mb-2"
                          value={
                            memoriaFase[linea]?.[`tipo_entrada_${clave}`] || ""
                          }
                          onChange={(e) => {
                            const updated = { ...memoriaFase };
                            updated[linea] = {
                              ...updated[linea],
                              [`tipo_entrada_${clave}`]: e.target.value,
                            };
                            setMemoriaFase(updated);
                          }}
                        >
                          <option value="">-- Selecciona --</option>
                          <option value="texto">Texto</option>
                          <option value="firma">Firma</option>
                        </select>

                        {/* Mostrar Input si selecciona "texto" */}
                        {memoriaFase[linea]?.[`tipo_entrada_${clave}`] ===
                          "texto" && (
                          <input
                            type="text"
                            className="text-center block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                            name={clave}
                            value={memoriaFase[linea]?.[clave] ?? ""}
                            required={item.binding}
                            onChange={inputChange}
                          />
                        )}

                        {/* Mostrar Firma si selecciona "firma" */}
                        {memoriaFase[linea]?.[`tipo_entrada_${clave}`] ===
                          "firma" && (
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
                      </>
                    )}

                    {/* TEMPERATURE */}
                    {type === "temperature" && (
                      <>
                        <input
                          type="number"
                          className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                          min={min}
                          max={max}
                          step="0.01"
                          name={clave}
                          value={memoriaFase[linea]?.[clave] ?? ""}
                          required={item.binding}
                          onChange={inputChange}
                        />
                        {memoriaFase[linea]?.[clave] !== undefined &&
                          (memoriaFase[linea][clave] < min ||
                            memoriaFase[linea][clave] > max) && (
                            <p
                              className="
                            mt-2 mb-2 px-4 py-2
                            text-sm text-center font-semibold
                            text-yellow-100
                            bg-gradient-to-r from-purple-900/90 via-purple-700/80 to-blue-900/80
                            rounded-xl shadow-lg
                            border border-yellow-400/40
                            backdrop-blur-sm
                            animate-pulse
                            max-w-xs mx-auto
                          "
                            >
                              ⚠️ Valor ingresado debe estar entre{" "}
                              <span className="font-bold">{min}</span> y{" "}
                              <span className="font-bold">{max}</span>.
                            </p>
                          )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <>
              <hr className="border-t border-white/20 my-6" />
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 text-sm rounded-lg hover:bg-blue-700 transition-all shadow-md"
                >
                  Siguiente Fase
                </button>
              </div>
            </>
          </form>
        </div>
      </div>
    </>
  );
};

export default App;
