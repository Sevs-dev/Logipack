"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  linea_procesos,
  generar_orden,
} from "@/app/services/planing/planingServices";
import Text from "@/app/components/text/Text";
import DateLoader from "@/app/components/loader/DateLoader";
import { LineasResponse, LocalType } from "@/app/interfaces/NewLineas";
import ModalControl from "@/app/components/planning/modalControl";
import { getPlanningById } from "@/app/services/planing/planingServices";
import { validate_orden } from "@/app/services/planing/planingServices";
import { getRestablecerOrden } from "@/app/services/planing/planingServices";
import {
  showSuccess,
  showError,
  showConfirm,
} from "@/app/components/toastr/Toaster";
import ModalSection from "@/app/components/modal/ModalSection";
import { FaCreativeCommonsNd, FaListUl } from "react-icons/fa";

const validar_estado = (): LocalType | null => {
  const ejecutar = localStorage.getItem("ejecutar");
  if (ejecutar) return JSON.parse(ejecutar);

  setTimeout(() => {
    requestIdleCallback(() => window.close());
  }, 6000);

  return null;
};

const NewLineas = () => {
  const [local, setLocal] = useState<LocalType | null>(null);
  const [lista, setLista] = useState<LineasResponse | null>(null);
  const [showModalControl, setShowModalControl] = useState(false);

  const hableRestablecerOrden = useCallback(async (id: number) => {
    const { plan } = await getPlanningById(id);

    // Validar si la orden tiene linea asignada
    if (plan.line === null) {
      showError("No se asignó línea a la planificación");
      return;
    }

    if (plan.status_dates === null || plan.status_dates === "En Creación") {
      showError("Orden no planificada, debe completar la planificación");
      return;
    }

    const data = await validate_orden(plan.id);
    if (data.estado === 100 || data.estado === null) {
      // confirmar para restablecer
      showConfirm("¿Estás seguro desea restablecer la orden?", async () => {
        const response = await getRestablecerOrden(plan.id);
        if (response.estado !== 200) {
          showError("Error, orden no permitida para restablecer");
          return;
        }
        showSuccess("Orden restablecida correctamente");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    } else {
      showError("La orden ya fue finalizada. Estado: " + data.estado);
    }
  }, []);

  const hableControlOrden = useCallback(async (id: number) => {
    const { plan } = await getPlanningById(id);

    // Validar si la orden tiene linea asignada
    if (plan.line === null) {
      showError("No se asignó línea a la planificación");
      return;
    }

    if (plan.status_dates === null || plan.status_dates === "En Creación") {
      showError("Orden no planificada, debe completar la planificación");
      return;
    }

    const data = await validate_orden(plan.id);
    if (data.estado === 100 || data.estado === null) {
      setShowModalControl(true);
    } else {
      showError("La orden ya fue finalizada. Estado: " + data.estado);
    }
  }, []);

  useEffect(() => {
    const data = validar_estado();
    if (data) setLocal(data);
  }, []);

  const cargarLineasProceso = async (localData: LocalType) => {
    try {
      const resp = await linea_procesos(localData.id);
      setLista(resp);
    } catch (error) {
      showError("Error al obtener las líneas de procesos: " + error);
    }
  };

  useEffect(() => {
    if (local) {
      cargarLineasProceso(local);
    }
  }, [local]);

  if (!local || !lista) {
    return (
      <DateLoader
        message=" No hay datos de la orden o líneas de procesos"
        backgroundColor="#1f2937"
        color="#ffff"
      />
    );
  }

  const orden = lista.orden;
  const plan = lista.plan;

  const lista_procesos = Array.isArray(lista.linea_procesos)
    ? lista.linea_procesos
    : [];
  const lista_fases = Array.isArray(lista.linea_fases) ? lista.linea_fases : [];

  if (orden?.estado === 11500) {
    window.close();
  }

  const verificarYGenerar = async () => {
    if (orden === null && local) {
      const { estado, message } = await generar_orden(local.id);
      if (local) {
        await cargarLineasProceso(local);
      }
      if (estado === 200) {
        showSuccess(message);
        return;
      } else {
        showError(message);
      }
    }
  };
  verificarYGenerar();

  // Si no hay orden, se muestra un loader
  if (orden === null) {
    return (
      <DateLoader
        message=" Cargando orden...."
        backgroundColor="#1f2937"
        color="#ffff"
      />
    );
  }

  const handleLinea = (
    id: number,
    tipo: string,
    descripcion: string,
    phase_type: string
  ) => {
    if (!local) return;
    local.linea = id;
    local.tipo = tipo;
    local.descripcion = descripcion;
    local.orden = orden;
    local.plan = plan;
    localStorage.setItem("ejecutar", JSON.stringify(local));

    if (phase_type === "Conciliación") {
      window.open("/pages/consolidacion/" + local.id, "_blank");
    } else if (phase_type === "Testigo") {
      window.open("/pages/testigo/" + local.id, "_blank");
    } else {
      window.open("/pages/ordenes_ejecutadas", "_blank");
    }

    setTimeout(() => {
      requestIdleCallback(() => window.close());
    }, 1000);
  };
  return (
    <div className="min-h-screen w-full bg-[rgb(var(--background))] text-[rgb(var(--foreground))] p-[10px] sm:p-[10px] flex flex-col rounded-2xl">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-full rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] shadow-md overflow-hidden">
          <div className="bg-[rgb(var(--surface-muted))] px-[10px] py-[10px] border-b border-[rgb(var(--border))] backdrop-blur-sm">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Información de la Orden
            </Text>
          </div>

          <div className="px-[10px] py-[10px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-[rgb(var(--foreground))]/80">
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
                Descripción
              </p>
              <p className="font-semibold text-[rgb(var(--foreground))] text-center">
                {orden?.descripcion_maestra}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Cliente
              </p>
              <p className="font-semibold text-[rgb(var(--foreground))] text-center">
                {orden?.cliente}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Planta
              </p>
              <p className="font-semibold text-[rgb(var(--foreground))] text-center">
                {orden?.planta}
              </p>
            </div>
            <div>
              <p className="text-[rgb(var(--foreground))]/60 text-center">
                Cantidad a producir
              </p>
              <p className="font-semibold text-[rgb(var(--foreground))] text-center">
                {orden?.cantidad_producir}
              </p>
            </div>

            <div className="flex flex-col items-center gap-y-2">
              <p className="text-sm font-medium text-[rgb(var(--foreground))]/60">
                Acciones
              </p>
              <div className="flex items-center gap-x-2">
                <button
                  onClick={() => hableRestablecerOrden(local?.id)}
                  className="bg-[rgb(var(--warning))] hover:bg-[rgb(var(--warning))]/90 text-[rgb(var(--foreground))] p-2.5 rounded-md transition shadow-md hover:shadow-lg"
                  aria-label="Restablecer Orden"
                  title="Restablecer"
                >
                  <FaListUl />
                </button>

                <button
                  onClick={() => hableControlOrden(local?.id)}
                  className="bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-hover))] text-[rgb(var(--accent-foreground))] p-2.5 rounded-md transition shadow-md hover:shadow-lg"
                  aria-label="Controlar Orden"
                  title="Control"
                >
                  <FaCreativeCommonsNd />
                </button>
              </div>
            </div>
          </div>

          {/* Líneas */}
          <section className="px-[10px] pb-[10px] pt-[10px]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Líneas
            </Text>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {lista_procesos.map((linea, index) => (
                <motion.div
                  key={linea.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Seleccionar línea: ${linea.descripcion}`}
                  onClick={() =>
                    handleLinea(
                      linea.id,
                      "linea",
                      linea.descripcion,
                      linea.phase_type
                    )
                  }
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-[200px] group relative cursor-pointer rounded-lg
                         bg-[rgb(var(--accent))]/15 border border-[rgb(var(--accent))]/30
                         text-[rgb(var(--foreground))] backdrop-blur-sm transition-all shadow-sm
                         hover:shadow-md hover:bg-[rgb(var(--accent))]/25 active:scale-95"
                >
                  <div className="flex items-center justify-center h-14 px-2 rounded-lg">
                    <span className="text-sm font-medium text-center truncate max-w-[200px]">
                      {linea.descripcion}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Fases */}
          <section className="px-[10px] pb-[10px] pt-[10px]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Fases
            </Text>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {lista_fases.map((linea, index) => (
                <motion.div
                  key={linea.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Seleccionar línea: ${linea.descripcion}`}
                  onClick={() =>
                    handleLinea(
                      linea.id,
                      "fase",
                      linea.descripcion,
                      linea.phase_type
                    )
                  }
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-[200px] group relative cursor-pointer rounded-lg
                         bg-[rgb(var(--accent))]/15 border border-[rgb(var(--accent))]/30
                         text-[rgb(var(--foreground))] backdrop-blur-sm transition-all shadow-sm
                         hover:shadow-md hover:bg-[rgb(var(--accent))]/25 active:scale-95"
                >
                  <div className="flex items-center justify-center h-14 px-2 rounded-lg">
                    <span className="text-sm font-medium text-center truncate max-w-[300px]">
                      {linea.descripcion}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </motion.section>

      {/* Modal de control */}
      {showModalControl && (
        <ModalSection
          isVisible={showModalControl}
          onClose={() => setShowModalControl(false)}
        >
          <ModalControl
            id={local?.id}
            showModal={showModalControl}
            setShowModal={setShowModalControl}
          />
        </ModalSection>
      )}
    </div>
  );
};

export default NewLineas;
