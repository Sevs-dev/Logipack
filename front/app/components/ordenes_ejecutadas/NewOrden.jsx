import { useEffect, useRef, useState } from "react";
import {
  siguiente_fase,
  guardar_formulario,
  validate_orden,
  condiciones_fase,
  validate_rol,
} from "@/app/services/planing/planingServices";
import {
  createTimer,
  getTimerEjecutadaById,
} from "../../services/timer/timerServices";
import {
  getStageId,
  controlStage,
} from "../../services/maestras/stageServices";
import { validateSignaturePass } from "../../services/userDash/securityPass";
import Firma from "../ordenes_ejecutadas/Firma";
import ModalBlock from "../modal/ModalBlock";

import Text from "../text/Text";
import Button from "../buttons/buttons";
import { showError } from "../toastr/Toaster";
import Timer from "../timer/Timer";
import DateLoader from "@/app/components/loader/DateLoader";

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB Config
const DB_NAME = "FasesDB";
const DB_VERSION = 1;
const STORE_NAME = "fasesStore";

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

const clearDB = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject("Error al limpiar IndexedDB");
    });
  } catch (error) {
    console.error("Error al limpiar IndexedDB:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Utils
const parseConfigRobusto = (raw) => {
  try {
    let cfg = raw;
    if (typeof cfg === "string") {
      let s = cfg.trim();
      // "\"{\\\"type\\\":...}\""
      if ((s.startsWith('"') && s.endsWith('"')) || s.includes('\\"')) {
        s = JSON.parse(s);
      }
      cfg = typeof s === "string" ? JSON.parse(s) : s;
    }
    return cfg && typeof cfg === "object" ? cfg : {};
  } catch {
    return {};
  }
};

const sigKey = (linea, clave) => `${linea}::${clave}`;

// ─────────────────────────────────────────────────────────────────────────────

const App = () => {
  const formRef = useRef(null);

  // Estado base
  const [local, setLocal] = useState(null);
  const [fase, setFase] = useState(null);
  const [sig, setSig] = useState(0);
  const [memoriaFase, setMemoriaFase] = useState({});
  const [timerData, setTimerData] = useState(null);
  const [timerReady, setTimerReady] = useState(false);
  const [showModal_rol, setShowModal_rol] = useState(false);
  const [showModal_fase, setShowModal_fase] = useState(false);

  // Estado de validación para signature
  const [sigUnlocked, setSigUnlocked] = useState({}); // { "linea::clave": true }
  const [sigModal, setSigModal] = useState({
    open: false,
    linea: null,
    clave: null,
    allowedRoles: [],
  });
  const [sigPassword, setSigPassword] = useState("");

  // Derivados seguros
  const orden = local?.orden;
  const linea = local?.linea;
  const plan = local?.plan;
  console.log(plan);
  const isProceso =
    typeof fase?.phase_type === "string" &&
    fase.phase_type.toLowerCase().includes("proceso");

  // ─── Cargar datos iniciales (localStorage) ────────────────────────────────
  useEffect(() => {
    try {
      const data = localStorage.getItem("ejecutar");
      if (data) setLocal(JSON.parse(data));
    } catch {
      showError("Datos inválidos en el almacenamiento local.");
    }
  }, []);

  // ─── Cargar memoria fase desde IndexedDB ──────────────────────────────────
  useEffect(() => {
    const cargarMemoria = async () => {
      const memoria = await readFromDB("memoria_fase");
      if (memoria) setMemoriaFase(memoria);
    };
    cargarMemoria();
  }, []);

  // ─── Obtener siguiente fase ───────────────────────────────────────────────
  useEffect(() => {
    if (!local?.id || !local.linea || !local.tipo) return;
    const cargarFase = async () => {
      try {
        const resp = await siguiente_fase(local.id, local.linea, local.tipo);
        setFase(resp.fases);
      } catch {
        showError("No se pudo obtener la fase.");
      }
    };
    cargarFase();
  }, [local, sig]);

  // ─── Condiciones de fase + Timer (solo en Proceso) ────────────────────────
  useEffect(() => {
    if (!fase) return;

    const guardarTimer = async () => {
      try {
        const adaptation = await controlStage(fase.adaptation_id);
        if (!adaptation?.id) return;

        const ejecutadaId = Number(fase.id);
        if (!Number.isFinite(ejecutadaId) || ejecutadaId <= 0) return;

        const time = Number(adaptation.repeat_minutes ?? 0);
        await createTimer({
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
      try {
        const resp = await condiciones_fase(
          fase.adaptation_date_id,
          fase.fases_fk
        );

        const rawEntry = (
          typeof document !== "undefined" ? document.cookie : ""
        )
          .split("; ")
          .find((row) => row.startsWith("role="));
        const rawPerfil = rawEntry?.split("=")[1] ?? "";
        const decoded = decodeURIComponent(rawPerfil).replace(/"/g, "").trim();

        const norm = (s) =>
          (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        // 👇 Soporta múltiples roles en la cookie: "Master,Coordinador"
        const userRoles = decoded
          .split(/[,;|]/)
          .map((r) => norm(r))
          .filter(Boolean);

        // Bypass por rol privilegiado
        const privileged = new Set(["administrador", "master"]);
        if (userRoles.some((r) => privileged.has(r))) {
          setShowModal_rol(false);
          setShowModal_fase(resp?.condicion_1 > 0);
          return;
        }

        // Validación contra roles permitidos por la fase
        const { roles } = await validate_rol(fase.fases_fk);
        const allowed = (roles?.role ?? "")
          .toString()
          .split(/[,;|]/)
          .map((r) => norm(r))
          .filter(Boolean);

        const tienePermiso = userRoles.some((r) => allowed.includes(r));
        setShowModal_rol(!tienePermiso);
        setShowModal_fase(resp?.condicion_1 > 0);
      } catch {
        // silencioso como pediste
      }
    };

    condicionFase();

    if (isProceso) {
      guardarTimer();
    } else {
      setTimerData(null);
      setTimerReady(false);
    }
  }, [fase, isProceso]);

  // ─── Inicializar valores por defecto de memoriaFase (sin mutar estado) ────
  useEffect(() => {
    if (!fase || linea == null) return;
    let parsed = [];
    try {
      parsed = JSON.parse(fase.forms || "[]");
    } catch {
      parsed = [];
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    setMemoriaFase((prev) => {
      // si ya hay datos para esta línea, no tocar
      if (prev?.[linea]) return prev;

      const inicialLinea = parsed.reduce((acc, item) => {
        acc[item.clave] = item.valor ?? "";
        return acc;
      }, {});
      const actualizado = { ...prev, [linea]: inicialLinea };
      saveToDB("memoria_fase", actualizado);
      return actualizado;
    });
  }, [fase, linea]);

  // ─── Handlers firma protegida ─────────────────────────────────────────────
  const openSigModal = (l, c, allowedRoles = []) =>
    setSigModal({ open: true, linea: l, clave: c, allowedRoles });

  const closeSigModal = () => {
    setSigModal({ open: false, linea: null, clave: null, allowedRoles: [] });
    setSigPassword("");
  };

  const onSigSelectMouseDown = (e, cfg, l, c) => {
    if (cfg?.signatureSpecific && !sigUnlocked[sigKey(l, c)]) {
      e.preventDefault();
      e.stopPropagation();
      openSigModal(
        l,
        c,
        Array.isArray(cfg.allowedRoles) ? cfg.allowedRoles : []
      );
    }
  };

  const onSigSelectKeyDown = (e, cfg, l, c) => {
    if (cfg?.signatureSpecific && !sigUnlocked[sigKey(l, c)]) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openSigModal(
          l,
          c,
          Array.isArray(cfg.allowedRoles) ? cfg.allowedRoles : []
        );
      }
    }
  };

  // util: lee rol desde cookie "role="
  const getCookieRole = () => {
    const raw = document.cookie
      .split("; ")
      .find((r) => r.startsWith("role="))
      ?.split("=")[1];
    return raw ? decodeURIComponent(raw).replace(/"/g, "").trim() : "";
  };

  // util: comparación case-insensitive
  const includesCI = (arr, val) =>
    Array.isArray(arr) &&
    arr.some(
      (x) => String(x).trim().toLowerCase() === String(val).trim().toLowerCase()
    );

  const submitSigValidation = async () => {
    try {
      const pass = String(sigPassword || "").trim();
      if (!pass) return showError("Ingresa la contraseña.");

      const signatureId = sigKey(sigModal.linea, sigModal.clave);

      const res = await validateSignaturePass({
        security_pass: pass,
        signature_id: signatureId,
      });

      if (!res?.valid)
        return showError("Contraseña no autorizada para esta firma.");

      setSigUnlocked((prev) => ({ ...prev, [signatureId]: true }));
      setSigPassword("");
      closeSigModal();
    } catch {
      console.error("❌ Validación firma error:");
      showError(e?.message ?? "Validación fallida. Intenta de nuevo.");
    }
  };

  // ─── Handlers generales ───────────────────────────────────────────────────
  const inputChange = (e) => {
    const { name, value } = e.target;
    if (linea == null) return;

    setMemoriaFase((prev) => {
      const actualizado = {
        ...prev,
        [linea]: {
          ...prev[linea],
          [name]: value,
        },
      };
      saveToDB("memoria_fase", actualizado);
      return actualizado;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fase || linea == null || !memoriaFase[linea]) {
      showError("No hay datos disponibles para procesar.");
      return;
    }

    let formsParsedSrc = [];
    try {
      formsParsedSrc = JSON.parse(fase.forms || "[]");
    } catch {
      formsParsedSrc = [];
    }

    const datosLinea = memoriaFase[linea] || {};
    const formsParsed = formsParsedSrc.map((form) => ({
      ...form,
      valor: datosLinea[form.clave] ?? "",
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
      user: local?.user,
    };

    const resp = await guardar_formulario(resultado);
    if (resp?.estado === 200) {
      await clearDB();
      setSig((prev) => prev + 1);
    }
  };

  const refetchTimer = async () => {
    if (!fase || !isProceso) return;
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

  // ─── Guardas y loaders previos ────────────────────────────────────────────
  if (!local || !local.orden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[rgb(var(--background))] gap-4">
        <DateLoader
          message=" No hay datos de la orden o líneas de procesos"
          backgroundColor={"rgb(var(--surface))"}
          color={"rgb(var(--foreground))"}
        />
      </div>
    );
  }

  if (!fase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[rgb(var(--background))] gap-4">
        <DateLoader
          message="Fase finalizada."
          backgroundColor={"rgb(var(--surface))"}
          color={"rgb(var(--foreground))"}
        />
      </div>
    );
  }

  // Formularios
  let forms = [];
  try {
    forms = JSON.parse(fase?.forms || "[]");
  } catch {
    forms = [];
    showError("El formato de los formularios es inválido.");
  }

  return (
    <>
      {/* Modales de bloqueo */}
      <ModalBlock
        isOpen={showModal_rol}
        onClose={() => setShowModal_rol(false)}
        message="Tu acceso está bloqueado temporalmente. Contacta al administrador."
      />
      <ModalBlock
        isOpen={showModal_fase}
        onClose={() => setShowModal_fase(false)}
        message="Fase bloqueada temporalmente. Contacta al administrador."
      />

      {/* TIMER SOLO EN PROCESOS */}
      {isProceso && (!timerReady || !timerData) && (
        <DateLoader
          message="Cargando datos del temporizador..."
          backgroundColor="#111827"
          color="#ffff"
        />
      )}
      {isProceso && timerReady && timerData && String(linea) !== "0" && (
        <Timer
          ejecutadaId={timerData.ejecutadaId}
          stageId={timerData.stageId}
          initialMinutes={timerData.initialMinutes}
          refetchTimer={refetchTimer}
        />
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="min-h-screen w-full bg-[rgb(var(--background))] text-[rgb(var(--foreground))] p-3 sm:p-4 md:p-[10px] flex flex-col rounded-2xl">
        <div className="w-full rounded-2xl bg-[rgb(var(--surface))] backdrop-blur-sm border border-[rgb(var(--border))] shadow-md overflow-hidden">
          <div className="bg-[rgb(var(--surface-muted))] px-3 sm:px-[10px] py-3 sm:py-[10px] border-b border-[rgb(var(--border))] backdrop-blur-sm">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Información de la Orden
            </Text>
          </div>

          <div
            className="
        px-3 sm:px-6 md:px-8 py-4 sm:py-6
        grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6
        gap-3 sm:gap-4 text-sm text-[rgb(var(--foreground))]/85
      "
          >
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Orden N°
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {orden?.number_order}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Orden del Cliente
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {plan?.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Cliente
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {orden?.cliente}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Planta
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {orden?.planta}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Maestra
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {orden?.descripcion_maestra}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Línea
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {linea} ({local.descripcion})
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Cantidad a producir
              </p>
              <p className="font-medium text-[rgb(var(--foreground))] text-center">
                {orden?.cantidad_producir}
              </p>
            </div>
          </div>
        </div>

        {/* Fase */}
        <div className="w-full rounded-2xl bg-[rgb(var(--surface))] backdrop-blur-sm border border-[rgb(var(--border))] shadow-md overflow-hidden mt-4">
          <div className="bg-[rgb(var(--surface-muted))] px-[10px] py-[10px] border-b border-[rgb(var(--border))] backdrop-blur-sm">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Fase de {fase?.description_fase} ({fase?.phase_type})
            </Text>
          </div>

          {/* Formulario */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="min-h-screen w-full bg-[rgb(var(--background))] text-[rgb(var(--foreground))] p-[10px] sm:p-[10px] flex flex-col rounded-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms.map((item, index) => {
                const config = parseConfigRobusto(item.config);
                const {
                  type,
                  options = [],
                  min,
                  max,
                  items = [],
                  signatureSpecific,
                } = config || {};
                const clave = item.clave;

                return (
                  <div key={index}>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      {item.descripcion_activitie}
                    </Text>

                    {/* MUESTREO */}
                    {type === "muestreo" && (
                      <p className="text-[rgb(var(--warning))]">
                        {items.map(({ min: a, max: b, valor }) => {
                          if (
                            orden?.cantidad_producir != null &&
                            a <= orden.cantidad_producir &&
                            orden.cantidad_producir <= b
                          ) {
                            return valor;
                          }
                          return null;
                        })}
                      </p>
                    )}

                    {/* TEXT */}
                    {type === "text" && (
                      <input
                        type="text"
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
                        required={item.binding}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          inputChange(e);
                        }}
                      />
                    )}

                    {/* NUMBER */}
                    {type === "number" && (
                      <input
                        type="number"
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
                        name={clave}
                        value={memoriaFase[linea]?.[clave] ?? ""}
                        required={item.binding}
                        onChange={inputChange}
                      />
                    )}

                    {/* SELECT */}
                    {type === "select" && (
                      <select
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                                  ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 ring-2 ring-[rgb(var(--accent))]"
                                  : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))]"
                              }`}
                            >
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
                                    ? "text-[rgb(var(--foreground))]"
                                    : "text-[rgb(var(--foreground))]/70"
                                }`}
                              >
                                {opt}
                              </span>
                              {isSelected && (
                                <svg
                                  className="h-5 w-5 text-[rgb(var(--accent))]"
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
                            className="flex items-center gap-2 text-[rgb(var(--foreground))]"
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
                              className="h-4 w-4 rounded border-[rgb(var(--border))] accent-[rgb(var(--accent))] focus:ring-[rgb(var(--ring))]"
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
                              <p className="text-[rgb(var(--foreground))]/60">
                                No se pudo mostrar el PDF.{" "}
                                <a
                                  href={memoriaFase[linea][clave]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[rgb(var(--accent))] underline"
                                >
                                  Haz clic aquí para verlo
                                </a>
                              </p>
                            </object>
                          </div>
                        )}

                        <input
                          className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                          className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                        {signatureSpecific &&
                          !sigUnlocked[sigKey(linea, clave)] && (
                            <div className="mb-2 text-xs text-[rgb(var(--warning))] text-center">
                              🔒 Requiere validación de rol antes de firmar.
                            </div>
                          )}

                        <select
                          className={`text-center block w-full px-3 py-2 bg-[rgb(var(--surface))] border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 mb-2 ${
                            signatureSpecific &&
                            !sigUnlocked[sigKey(linea, clave)]
                              ? "border-[rgb(var(--warning))]"
                              : "border-[rgb(var(--border))]"
                          }`}
                          required
                          value={
                            memoriaFase[linea]?.[`tipo_entrada_${clave}`] || ""
                          }
                          onMouseDown={(e) =>
                            onSigSelectMouseDown(e, config, linea, clave)
                          }
                          onKeyDown={(e) =>
                            onSigSelectKeyDown(e, config, linea, clave)
                          }
                          onChange={(e) => {
                            if (
                              signatureSpecific &&
                              !sigUnlocked[sigKey(linea, clave)]
                            ) {
                              e.preventDefault();
                              return;
                            }
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

                        {memoriaFase[linea]?.[`tipo_entrada_${clave}`] ===
                          "texto" && (
                          <input
                            type="text"
                            className="text-center block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50"
                            name={clave}
                            value={memoriaFase[linea]?.[clave] ?? ""}
                            required={item.binding}
                            onChange={inputChange}
                          />
                        )}

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
                          className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
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
                          text-[rgb(var(--foreground))]
                          bg-[rgb(var(--warning))]/20
                          rounded-xl shadow
                          border border-[rgb(var(--warning))]/40
                          backdrop-blur-sm
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

                    {/* INFORMATIVO */}
                    {type === "informativo" && (
                      <label
                        className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm text-[rgb(var(--foreground))] text-center"
                        name={clave}
                      >
                        {item.placeholder}
                      </label>
                    )}
                  </div>
                );
              })}

              {/* Modal de contraseña para firma */}
              {sigModal.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
                  <div className="w-full max-w-sm rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] p-5 shadow-2xl">
                    <h3 className="text-[rgb(var(--foreground))] text-lg font-semibold mb-2">
                      Validación requerida
                    </h3>
                    <p className="text-[rgb(var(--foreground))]/80 text-sm mb-4">
                      Ingresa la contraseña para habilitar la firma.
                    </p>
                    <input
                      type="password"
                      autoFocus
                      value={sigPassword}
                      onChange={(e) => setSigPassword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && submitSigValidation()
                      }
                      className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50"
                      placeholder="Contraseña"
                    />
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeSigModal}
                        className="px-4 py-2 rounded-lg bg-[rgb(var(--surface-muted))] hover:bg-[rgb(var(--surface-muted))]/80 text-[rgb(var(--foreground))] text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={submitSigValidation}
                        className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-hover))] text-[rgb(var(--accent-foreground))] text-sm shadow"
                      >
                        Validar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-t border-[rgb(var(--border))] my-6" />
            <div className="flex justify-center">
              <Button type="submit" variant="after2" label="Siguiente Fase" />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default App;
