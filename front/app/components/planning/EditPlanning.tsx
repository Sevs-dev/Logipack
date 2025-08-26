import React, { useState, useEffect, useCallback, useMemo } from "react";
import { COLORS } from "@/app/constants/colors";
import dayjs from "dayjs";
// 🔹 Componentes
import Button from "../buttons/buttons";
import { showSuccess, showError } from "../toastr/Toaster";
import Table from "../table/Table";
import ModalControl from "./modalControl";
import Text from "../text/Text";
import { IconSelector } from "../dinamicSelect/IconSelector";
import ModalSection from "../modal/ModalSection";
import { InfoPopover } from "../buttons/InfoPopover";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import { MachinePlanning } from "../../interfaces/NewMachine";
import { UserPlaning } from "../../interfaces/CreateUser";
import SelectorDual from "../SelectorDual/SelectorDual";
import DateLoader from "@/app/components/loader/DateLoader";
import { API_URL } from "../../config/api";
// 🔹 Servicios
import {
  updatePlanning,
  getActivitiesByPlanning,
  getPlanningById,
  validate_orden,
  getConsultPlanning,
  actividades_ejecutadas,
  getRestablecerOrden,
} from "../../services/planing/planingServices";
import { getActivitieId } from "../../services/maestras/activityServices";
import {
  getManu,
  getManuId,
} from "@/app/services/userDash/manufacturingServices";
import { getMachin } from "@/app/services/userDash/machineryServices";
import { getUsers } from "@/app/services/userDash/authservices";

// 🔹 Interfaces
import {
  Plan,
  ActivityDetail,
  sanitizePlan,
  ServerPlan,
  DurationItem,
  PlanServ,
} from "@/app/interfaces/EditPlanning";

/* =========================
 *  Helpers puros (módulo)
 * ========================= */
type RecordLike = Record<string, unknown>;

const isRecord = (v: unknown): v is RecordLike =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const toFiniteNumber = (v: unknown): number | null => {
  if (isNumber(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const safeParseJSON = <T = unknown,>(v: unknown, fallback: T): T => {
  if (v == null) return fallback;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return fallback;
    try {
      return JSON.parse(s) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
};

const ensureArray = <T = unknown,>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (v == null || v === "") return [];
  const parsed = safeParseJSON<unknown>(v, []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
};

// Saca ids de actividad aunque vengan anidados o mezclados (sin any)
const extractActivityIds = (input: unknown): number[] => {
  const out: number[] = [];

  const visit = (val: unknown): void => {
    if (val == null) return;

    const asNum = toFiniteNumber(val);
    if (asNum !== null) {
      out.push(asNum);
      return;
    }

    if (typeof val === "string") {
      const parsed = safeParseJSON<unknown>(val, null);
      if (parsed !== null) visit(parsed);
      return;
    }

    if (Array.isArray(val)) {
      val.forEach(visit);
      return;
    }

    if (isRecord(val)) {
      if ("id" in val) {
        const idVal = toFiniteNumber((val as RecordLike).id);
        if (idVal !== null) out.push(idVal);
      }
      if ("activities" in val) visit((val as RecordLike).activities);
      if ("lines" in val) visit((val as RecordLike).lines);
      if ("ID_ACTIVITIES" in val) visit((val as RecordLike).ID_ACTIVITIES);
      if ("stages" in val) visit((val as RecordLike).stages);
    }
  };

  visit(input);
  return Array.from(new Set(out));
};

interface NormalizedLine extends RecordLike {
  machine: number[];
  users: number[];
  resource: string[];
  duration_breakdown: DurationItem[] | null;
  _activityIds: number[];
}

const normalizeLine = (line: unknown): NormalizedLine => {
  const obj = isRecord(line) ? line : {};

  const machineRaw = ensureArray<unknown>(obj["machine"]);
  const usersRaw = ensureArray<unknown>(obj["users"]);
  const resourceRaw = ensureArray<unknown>(obj["resource"]);
  const durationBreakdown = safeParseJSON<DurationItem[] | null>(
    obj["duration_breakdown"],
    null
  );

  const machine = machineRaw
    .map(toFiniteNumber)
    .filter((n): n is number => n !== null);
  const users = usersRaw
    .map(toFiniteNumber)
    .filter((n): n is number => n !== null);
  const resource = resourceRaw.map((r) =>
    typeof r === "string" ? r : JSON.stringify(r)
  );

  const ids = [
    ...extractActivityIds(obj["ID_ACTIVITIES"]),
    ...extractActivityIds(obj["activities"]),
    ...extractActivityIds(obj["stages"]),
  ];

  return {
    ...obj,
    machine,
    users,
    resource,
    duration_breakdown: durationBreakdown,
    _activityIds: Array.from(new Set(ids)),
  };
};

// 🔹 función async externa y estable para evitar deps en hooks
export async function fetchAndProcessPlans(id: number): Promise<ServerPlan[]> {
  const resp: unknown = await getActivitiesByPlanning(id);

  const serverPlansRaw: unknown = isRecord(resp)
    ? resp.plan ?? (resp as RecordLike).plans ?? resp
    : resp;

  const rawArray: unknown[] = Array.isArray(serverPlansRaw)
    ? serverPlansRaw
    : serverPlansRaw != null
    ? [serverPlansRaw]
    : [];

  if (rawArray.length === 0) {
    const keys = isRecord(resp) ? Object.keys(resp).join(", ") : "—";
    throw new Error(
      `Planificación no encontrada desde servidor (id=${id}). Payload keys: ${keys}`
    );
  }

  const normalized = rawArray.map(normalizeLine);

  const serverPlansWithDetails = await Promise.all(
    normalized.map(async (line) => {
      const ids = line._activityIds ?? [];
      const activitiesDetails: ActivityDetail[] = ids.length
        ? await Promise.all(ids.map(async (n) => await getActivitieId(n)))
        : [];

      const { _activityIds: _omit, ...rest } = line;
      void _omit;
      return { ...(rest as unknown as ServerPlan), activitiesDetails };
    })
  );

  return serverPlansWithDetails;
}

/* =========================
 *      Componente
 * ========================= */
function EditPlanning({ canEdit = false, canView = false }: CreateClientProps) {
  const [planning, setPlanning] = useState<Plan[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [manu, setManu] = useState<{ id: number; name: string }[]>([]);
  const [machine, setMachine] = useState<{ id: number; name: string }[]>([]);
  const [user, setUser] = useState<{ id: number; name: string }[]>([]);
  const [activitiesDetails, setActivitiesDetails] = useState<ActivityDetail[]>(
    []
  );
  const [lineActivities, setLineActivities] = useState<
    Record<number, number[]>
  >({});
  const [draggedActivityId, setDraggedActivityId] = useState<number | null>(
    null
  );
  const [lineDetails, setLineDetails] = useState<
    Record<number, { name: string }>
  >({});
  const [selectedMachines, setSelectedMachines] = useState<MachinePlanning[]>(
    []
  );
  const [selectedUsers, setSelectedUsers] = useState<UserPlaning[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [showModalControl, setShowModalControl] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchModalData = async () => {
      try {
        const [manuData, machineData, userData] = await Promise.all([
          getManu(),
          getMachin(),
          getUsers(),
        ]);
        setManu(manuData);
        setMachine(machineData);
        setUser(userData);
      } catch (error) {
        showError("Error cargando datos para el modal");
        console.error("❌ Error en fetchModalData:", error);
      }
    };
    fetchModalData();
  }, [isOpen]);

  const fetchAll = useCallback(async () => {
    try {
      const planningData = await getConsultPlanning();
      setPlanning(planningData);
    } catch (error) {
      showError("Error cargando datos iniciales");
      console.error("Error en fetchAll:", error);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      fetchAll();
    }
  }, [fetchAll, canView]);

  useEffect(() => {
    if (!currentPlan) return;
    setLineActivities((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      if (
        currentPlan.lineActivities &&
        Object.keys(currentPlan.lineActivities).length > 0
      ) {
        return currentPlan.lineActivities;
      }
      let keys: number[] = [];
      if (Array.isArray(currentPlan.line)) {
        keys = currentPlan.line;
      } else if (typeof currentPlan.line === "string") {
        try {
          keys = JSON.parse(currentPlan.line);
        } catch {
          keys = [];
        }
      }
      const initial = keys.reduce((acc, lineId) => {
        acc[lineId] = [];
        return acc;
      }, {} as Record<number, number[]>);
      return initial;
    });
  }, [currentPlan]);

  useEffect(() => {
    const fetchLineDetails = async () => {
      if (!currentPlan || !currentPlan.line) {
        setLineDetails({});
        return;
      }
      const lines = getLinesArray(currentPlan.line);
      const details: Record<number, { name: string }> = {};
      await Promise.all(
        lines.map(async (lineId) => {
          try {
            const data = await getManuId(lineId);
            details[lineId] = data;
          } catch (err) {
            console.error(`Error cargando línea ${lineId}`, err);
            details[lineId] = { name: `Línea ${lineId} ` };
          }
        })
      );
      setLineDetails(details);
    };
    fetchLineDetails();
  }, [currentPlan]);

  useEffect(() => {
    if (!currentPlan) return;
    setLineActivities((prev) => {
      const currentLines = getLinesArray(currentPlan.line);
      const newLineActivities: Record<number, number[]> = {};
      currentLines.forEach((lineId) => {
        newLineActivities[lineId] = prev[lineId] || [];
      });
      return newLineActivities;
    });
  }, [currentPlan]);

  function calculateEndDateRespectingWorkHours(
    start: string,
    durationMinutes: number
  ): string {
    const WORK_START_HOUR = 6;
    const WORK_END_HOUR = 18;

    let remainingMinutes = durationMinutes;
    const current = new Date(start);

    while (remainingMinutes > 0) {
      const currentHour = current.getHours();
      const currentMinute = current.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      const workStartMinutes = WORK_START_HOUR * 60;
      const workEndMinutes = WORK_END_HOUR * 60;

      if (currentTotalMinutes < workStartMinutes) {
        current.setHours(WORK_START_HOUR, 0, 0, 0);
      } else if (currentTotalMinutes >= workEndMinutes) {
        current.setDate(current.getDate() + 1);
        current.setHours(WORK_START_HOUR, 0, 0, 0);
      }

      const nowMinutes = current.getHours() * 60 + current.getMinutes();
      const minutesLeftToday = workEndMinutes - nowMinutes;
      const minutesToAdd = Math.min(remainingMinutes, minutesLeftToday);

      current.setMinutes(current.getMinutes() + minutesToAdd);
      remainingMinutes -= minutesToAdd;

      if (remainingMinutes > 0) {
        current.setDate(current.getDate() + 1);
        current.setHours(WORK_START_HOUR, 0, 0, 0);
      }
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(
      current.getDate()
    )}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
  }

  const handleSave = async (updatedPlan: Plan) => {
    if (isSaving) return;
    setIsSaving(true);
    if (!updatedPlan) {
      showError("No hay datos para guardar.");
      setIsSaving(false);
      return;
    }
    const diffInMinutes = dayjs(updatedPlan.end_date).diff(
      dayjs(updatedPlan.start_date),
      "minute"
    );
    if (diffInMinutes < 5) {
      showError(
        "La duración entre la fecha de inicio y fin debe ser de al menos 5 minutos."
      );
      setIsSaving(false);
      return;
    }
    try {
      const cleanedPlan = sanitizePlan(updatedPlan);
      const lines: number[] = getLinesArray(updatedPlan.line);
      const hasEmptyLines = lines.some((lineId) => {
        const activityIds = lineActivities[lineId] || [];
        return activityIds.length === 0;
      });

      if (hasEmptyLines) {
        showError(
          "Hay líneas sin actividades asignadas. Por favor, completa todas antes de guardar."
        );
        setIsSaving(false);
        return;
      }

      const formattedLines = lines.map((lineId) => {
        const activityIdsInLine = lineActivities[lineId] || [];
        const filteredActivities = (activitiesDetails || []).filter(
          (activity) => activityIdsInLine.includes(activity.id)
        );
        return {
          id: lineId,
          activities: filteredActivities.map((activity) => ({
            id: activity.id,
          })),
        };
      });

      type MutablePlanServ = PlanServ & Record<string, unknown>;

      const planToSave: MutablePlanServ = {
        ...cleanedPlan,
        adaptation_id: updatedPlan.adaptation_id,
        factory: updatedPlan.factory,
        orderNumber: updatedPlan.orderNumber,
        number_order: updatedPlan.number_order,
        color: currentPlan?.color ?? undefined,
        icon: currentPlan?.icon ?? undefined,
        line: lines,
        activities: formattedLines,
        users: selectedUsers.map((u) => u.id),
        machine: selectedMachines.map((m) => m.id),
        duration: updatedPlan.duration?.toString() ?? undefined,
        duration_breakdown: updatedPlan.duration_breakdown,
        status_dates: updatedPlan.status_dates,
        created_at: updatedPlan.created_at,
        start_date: updatedPlan.start_date,
        end_date: updatedPlan.end_date,
      };

      const keysToStringify: (keyof Pick<
        PlanServ,
        "duration_breakdown" | "ingredients" | "bom" | "master"
      >)[] = ["duration_breakdown", "ingredients", "bom", "master"];
      keysToStringify.forEach((key) => {
        const value = planToSave[key];
        if (typeof value === "object" && value !== null) {
          planToSave[key] = JSON.stringify(value);
        }
      });

      const keysToNullify: (keyof Pick<PlanServ, "bom" | "master">)[] = [
        "bom",
        "master",
      ];
      keysToNullify.forEach((key) => {
        const value = planToSave[key];
        if (value === "null" || value === "") {
          planToSave[key] = null;
        }
      });

      // ✅ limpia campos innecesarios para el backend
      delete planToSave.activitiesDetails;
      delete planToSave.lineActivities;
      delete planToSave.client_name;

      await updatePlanning(updatedPlan.id, planToSave as PlanServ);
      await fetchAll();
      setIsOpen(false);
      handleClose();
      showSuccess("Planificación guardada correctamente");
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      showError("Error al guardar la planificación");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = useCallback(
    async (id: number) => {
      const selectedPlan = planning.find((plan: Plan) => plan.id === id);
      if (!selectedPlan) {
        showError("Planificación no encontrada localmente");
        return;
      }
      setLoadingModal(true);

      try {
        // ⚠️ Forzar carga previa si aún no está
        let currentMachine = machine;
        if (!machine.length) {
          currentMachine = await getMachin();
          setMachine(currentMachine);
        }

        let currentUsers = user;
        if (!user.length) {
          currentUsers = await getUsers();
          setUser(currentUsers);
        }

        // ✅ función externa estable → no entra en deps
        const serverPlansWithDetails: ServerPlan[] = await fetchAndProcessPlans(
          id
        );
        if (!serverPlansWithDetails || serverPlansWithDetails.length === 0) {
          showError("No se encontró información detallada en el servidor.");
          return;
        }

        const matchedPlan =
          serverPlansWithDetails.find(
            (p) =>
              (p as unknown as RecordLike).ID_ADAPTACION === selectedPlan.id
          ) || serverPlansWithDetails[0];

        const activitiesDetails =
          ((matchedPlan as unknown as RecordLike)
            .activitiesDetails as ActivityDetail[]) ?? [];

        const newLineActivities: Record<number, number[]> = {};

        if (Array.isArray(selectedPlan.activities)) {
          selectedPlan.activities.forEach((lineObj) => {
            if (lineObj?.id && Array.isArray(lineObj.activities)) {
              newLineActivities[lineObj.id] = lineObj.activities.map(
                (a) => a.id
              );
            }
          });
        }

        if (
          Object.keys(newLineActivities).length === 0 &&
          activitiesDetails.length > 0
        ) {
          activitiesDetails.forEach((activity: ActivityDetail) => {
            const binding = activity.binding;
            const ids = Array.isArray(binding) ? binding : [binding];
            ids.forEach((lineId) => {
              const lineKey = Number(lineId);
              if (!newLineActivities[lineKey]) newLineActivities[lineKey] = [];
              if (!newLineActivities[lineKey].includes(activity.id)) {
                newLineActivities[lineKey].push(activity.id);
              }
            });
          });
        }

        setLineActivities(newLineActivities);
        setActivitiesDetails(activitiesDetails);

        setSelectedMachines(
          currentMachine.filter((m) =>
            (selectedPlan.machine || []).includes(m.id)
          )
        );
        setSelectedUsers(
          currentUsers.filter((u) => (selectedPlan.users || []).includes(u.id))
        );

        const fullPlan: Plan = {
          ...selectedPlan,
          activitiesDetails,
          lineActivities: newLineActivities,
          line: getLinesArray(selectedPlan.line),
        };

        setCurrentPlan(fullPlan);
        setIsOpen(true);
      } catch (error) {
        console.error("❌ Error fetching plan:", error);
        showError("Error al cargar la planificación para edición");
      } finally {
        setLoadingModal(false);
      }
    },
    [planning, machine, user] // ✅ nada de fetchAndProcessPlans aquí
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentPlan(null);
    setLineActivities({});
    setActivitiesDetails([]);
    setDraggedActivityId(null);
    setSelectedMachines([]);
    setSelectedUsers([]);
  }, []);

  const handleDelete = useCallback(() => {
    // noop
  }, []);

  const getFormattedDuration = (input: number | string): string => {
    let totalSeconds = 0;

    if (typeof input === "string") input = input.replace(",", ".");
    const num = typeof input === "number" ? input : parseFloat(input);

    if (isNaN(num) || num <= 0) return "0 seg";

    const [minStr, secStr] = num.toString().split(".");
    const mins = parseInt(minStr, 10) || 0;
    const secs = secStr ? parseInt(secStr.padEnd(2, "0").slice(0, 2), 10) : 0;
    totalSeconds = mins * 60 + secs;

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    const pushPart = (
      value: number,
      singular: string,
      plural: string = singular + "s"
    ) => {
      if (value > 0) parts.push(`${value} ${value === 1 ? singular : plural}`);
    };

    pushPart(days, "día");
    pushPart(hours, "hora");
    pushPart(minutes, "min", "min");

    const shouldShowSeconds =
      totalSeconds < 3600 && seconds > 0 && days === 0 && hours === 0;
    if (shouldShowSeconds) {
      pushPart(seconds, "seg", "seg");
    }

    return parts.join(" ");
  };

  function formatDurationBreakdown(breakdown: string | DurationItem[]): string {
    const parsed: DurationItem[] =
      typeof breakdown === "string" ? JSON.parse(breakdown) : breakdown;
    return parsed
      .map((item: DurationItem) => {
        if (item.fase === "TOTAL") {
          return `🧮 TOTAL → ${getFormattedDuration(item.resultado)}`;
        }
        const { teorica_total, multiplicacion, resultado } = item;
        if (multiplicacion && teorica_total) {
          return `${item.fase} → ${multiplicacion} = ${resultado} min`;
        }
        return `${item.fase} → ${resultado} min`;
      })
      .join("\n");
  }

  const handleDrop = (lineId: number) => {
    if (draggedActivityId === null) return;
    setLineActivities((prev) => {
      const updated = { ...prev };
      if (updated[lineId]?.includes(draggedActivityId)) return prev;
      updated[lineId] = [...(updated[lineId] || []), draggedActivityId];
      return updated;
    });
    setDraggedActivityId(null);
  };

  const removeActivityFromLine = (lineId: number, actId: number) => {
    setLineActivities((prev) => {
      const updated = { ...prev };
      if (updated[lineId]) {
        updated[lineId] = updated[lineId].filter((id) => id !== actId);
      }
      return updated;
    });
  };

  function getLinesArray(line: string | number[] | null): number[] {
    if (Array.isArray(line)) return line;
    if (typeof line === "string") {
      try {
        return JSON.parse(line);
      } catch {
        return [];
      }
    }
    return [];
  }

  const availableActivities = useMemo(
    () => activitiesDetails,
    [activitiesDetails]
  );

  const handleTerciario = useCallback(
    async (id: number) => {
      const { plan } = await getPlanningById(id);

      if (plan.line === null) {
        showError("No se asignó línea a la planificación");
        return;
      }

      if (plan.status_dates === null || plan.status_dates === "En Creación") {
        showError("Orden no planificada, debe completar la planificación");
        return;
      }

      localStorage.removeItem("ejecutar");

      const data = await validate_orden(plan.id);
      if (data.estado === 100 || data.estado === null) {
        const userCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("name="))
          ?.split("=")[1];

        if (!userCookie) {
          showError("No se encontró usuario");
          return;
        }

        localStorage.setItem(
          "ejecutar",
          JSON.stringify({
            id: plan.id,
            user: userCookie,
          })
        );

        window.open("/pages/lineas", "_blank");
        handleClose();
      } else {
        showError("La orden ya fue finalizada. Estado: " + data.estado);
        fetchAll();
      }
    },
    [fetchAll, handleClose]
  );

  const hableRestablecerOrden = useCallback(
    async (id: number) => {
      const { plan } = await getPlanningById(id);

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
        const response = await getRestablecerOrden(plan.id);
        if (response.estado !== 200) {
          showError("Error, orden no permitida para restablecer");
          return;
        }
        showSuccess("Orden restablecida correctamente");
        const userCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("name="))
          ?.split("=")[1];

        if (!userCookie) {
          showError("No se encontró usuario");
          return;
        }

        localStorage.setItem(
          "ejecutar",
          JSON.stringify({
            id: plan.id,
            user: userCookie,
          })
        );

        setTimeout(() => {
          window.open("/pages/lineas", "_blank");
          handleClose();
        }, 3000);
      } else {
        showError("La orden ya fue finalizada. Estado: " + data.estado);
        fetchAll();
      }
    },
    [fetchAll, handleClose]
  );

  const hableControlOrden = useCallback(async (id: number) => {
    const { plan } = await getPlanningById(id);

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

  //Componente SelectorDual
  const agregarMaquina = (m: MachinePlanning) => {
    if (!selectedMachines.find((x) => x.id === m.id)) {
      setSelectedMachines([...selectedMachines, m]);
    }
  };

  const removerMaquina = (id: number) => {
    setSelectedMachines(selectedMachines.filter((m) => m.id !== id));
  };

  const agregarUser = (u: UserPlaning) => {
    if (!selectedUsers.find((x) => x.id === u.id)) {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const removerUser = (id: number) => {
    setSelectedUsers(selectedUsers.filter((m) => m.id !== id));
  };

  const handlePDF = (id: number) => {
    const url = `${API_URL}/pdf/plan/${id}`;
    window.open(url, "_blank");
  };

  const obtenerActividades = useCallback(async (id: number) => {
    const { plan } = await getPlanningById(id);
    if (!plan?.id) {
      showError("No se pudo obtener el ID de planificación");
      return;
    }
    try {
      const data = await actividades_ejecutadas(plan.id);
      if ((data as RecordLike)?.actividades) {
        window.open(`/pages/detalle/${plan.id}`);
      }
    } catch (error) {
      console.error("Error al obtener fases:", error);
    }
  }, []);

  return (
    <div className="break-inside-avoid mb-4">
      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.69)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {loadingModal && (
        <DateLoader
          message="Cargando datos de planificación..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {isOpen && currentPlan && (
        <ModalSection
          isVisible={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
        >
          <Text type="title" color="text-[#000]">
            Editar Acondicionamiento
          </Text>
          <h2 className="text-xl font-bold mb-6">Editar planificación</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Consecutivo
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                readOnly
                value={currentPlan.number_order}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    number_order: e.target.value,
                  })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Artículo */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Artículo
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                readOnly
                value={currentPlan.codart}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, codart: e.target.value })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Fecha de entrega */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Fecha de entrega
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                type="date"
                readOnly
                value={currentPlan.deliveryDate}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    deliveryDate: e.target.value,
                  })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Registro Sanitario */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Registro Sanitario
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.healthRegistration}
                readOnly
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    healthRegistration: e.target.value,
                  })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Lote */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Lote
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.lot}
                readOnly
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, lot: e.target.value })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 N° de orden */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                N° de orden
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.orderNumber}
                readOnly
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    orderNumber: e.target.value,
                  })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Cantidad a producir */}
            {currentPlan && (
              <div className="break-inside-avoid mb-4">
                <Text type="subtitle" color="#000">
                  Cantidad a producir
                </Text>
                <input
                  className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  type="number"
                  readOnly
                  value={currentPlan.quantityToProduce?.toString() ?? ""}
                  onChange={(e) =>
                    setCurrentPlan({
                      ...currentPlan,
                      quantityToProduce: parseFloat(e.target.value),
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
            )}
            {/* 🔹 Cliente */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Cliente
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.client_name || ""}
                readOnly
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    client_name: e.target.value,
                  })
                }
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Planta */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Planta
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.factory || ""}
                readOnly
                disabled={!canEdit}
              />
            </div>
            {/* 🔹 Lineas */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Líneas
              </Text>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                {/* Lista de líneas disponibles */}
                <div className="sm:w-1/2 w-full">
                  <select
                    multiple
                    className="w-full h-48 border p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={(() => {
                      if (!currentPlan.line) return [];
                      if (Array.isArray(currentPlan.line))
                        return currentPlan.line.map(String);
                      try {
                        return JSON.parse(currentPlan.line).map(String);
                      } catch {
                        return [];
                      }
                    })()}
                    onChange={(e) => {
                      const currentLine = (() => {
                        if (!currentPlan.line) return [] as number[];
                        if (Array.isArray(currentPlan.line))
                          return currentPlan.line;
                        try {
                          return JSON.parse(currentPlan.line) as number[];
                        } catch {
                          return [] as number[];
                        }
                      })();

                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => Number(option.value)
                      );
                      const merged = Array.from(
                        new Set([...currentLine, ...selected])
                      );
                      setCurrentPlan({ ...currentPlan, line: merged });
                    }}
                    disabled={!canEdit}
                  >
                    {manu.length > 0 ? (
                      manu
                        .filter(
                          (line) => !(currentPlan.line ?? []).includes(line.id)
                        )
                        .map((line) => (
                          <option key={line.id} value={line.id.toString()}>
                            {line.name}
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>
                        No hay líneas disponibles
                      </option>
                    )}
                  </select>
                </div>

                {/* Lista de líneas seleccionadas */}
                <div className="sm:w-1/2 w-full border rounded-lg p-3 h-48 overflow-auto bg-gray-50">
                  {getLinesArray(currentPlan.line).length > 0 ? (
                    getLinesArray(currentPlan.line).map((lineId) => {
                      const line = manu.find((l) => l.id === lineId);
                      if (!line) return null;
                      return (
                        <div
                          key={line.id}
                          className="flex justify-between items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-md mb-2"
                        >
                          <span className="truncate">{line.name}</span>
                          <button
                            onClick={() =>
                              setCurrentPlan({
                                ...currentPlan,
                                line: getLinesArray(currentPlan.line).filter(
                                  (id) => id !== line.id
                                ),
                              })
                            }
                            className="text-red-500 hover:text-red-700 font-bold"
                            disabled={!canEdit}
                          >
                            ✖
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No hay líneas seleccionadas
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Actividades disponibles para arrastrar */}
            <div className="break-inside-avoid mb-4">
              <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm transition-all max-h-64 overflow-y-auto scrollbar-thin">
                <Text type="subtitle" color="#000">
                  Actividades disponibles
                </Text>
                {availableActivities.map((act) => {
                  const isDisabled = !canEdit;
                  return (
                    <div
                      key={act.id}
                      draggable={!isDisabled}
                      onDragStart={() => {
                        if (!isDisabled) setDraggedActivityId(act.id);
                      }}
                      className={`border border-gray-300 p-3 mb-3 rounded-md ${
                        isDisabled
                          ? "cursor-not-allowed bg-gray-100 text-gray-900"
                          : "cursor-grab bg-white hover:shadow"
                      } shadow-sm transition-shadow flex justify-between items-center`}
                      title={
                        isDisabled
                          ? "No tienes permiso para arrastrar actividades"
                          : ""
                      }
                    >
                      <span className="text-gray-700 text-center">
                        {act.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Líneas y sus actividades */}
            <div className="break-inside-avoid mb-4">
              <div className="flex-[3] flex gap-6 flex-wrap">
                {!currentPlan || !currentPlan.line ? (
                  <p>No hay líneas disponibles.</p>
                ) : (
                  getLinesArray(currentPlan.line).map((lineId) => {
                    const activitiesForLine = lineActivities[lineId];
                    return (
                      <div
                        key={lineId}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(lineId)}
                        className="flex-1 min-w-[250px] border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 transition-colors"
                      >
                        <Text type="subtitle" color="#000">
                          {lineDetails[lineId]?.name || `Línea ${lineId}`}
                        </Text>

                        {Array.isArray(activitiesForLine) &&
                        activitiesForLine.length > 0 ? (
                          activitiesForLine.map((actId) => {
                            const act = activitiesDetails.find(
                              (a) => a.id === actId
                            );
                            if (!act) {
                              return (
                                <p key={actId} className="text-red-400 italic">
                                  Actividad no encontrada (ID: {actId})
                                </p>
                              );
                            }

                            return (
                              <div
                                key={act.id}
                                draggable
                                onDragStart={() => setDraggedActivityId(act.id)}
                                className="border border-blue-300 p-3 mb-3 rounded-md cursor-grab bg-teal-50 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                              >
                                <span className="text-gray-800 text-center">
                                  {act.description}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeActivityFromLine(lineId, act.id);
                                  }}
                                  className="ml-3 text-red-500 hover:text-red-700 font-bold"
                                  aria-label={`Eliminar actividad ${act.description}`}
                                >
                                  &times;
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-400 italic">
                            Sin actividades
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* 🔹 Maquinaria */}
            <div className="break-inside-avoid mb-4">
              <SelectorDual
                titulo="Maquinaria"
                disponibles={machine}
                seleccionados={selectedMachines}
                onAgregar={agregarMaquina}
                onQuitar={removerMaquina}
              />
            </div>
            <div className="break-inside-avoid mb-4">
              <SelectorDual
                titulo="Usuarios"
                disponibles={user}
                seleccionados={selectedUsers}
                onAgregar={agregarUser}
                onQuitar={removerUser}
              />
            </div>
            {/* 🔹 Recursos */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Recursos
              </Text>
              <textarea
                name="resource"
                value={currentPlan.resource || ""}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    resource: e.target.value,
                  })
                }
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            {/* Color */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Color
              </Text>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map((color, index) => {
                  const isSelected = currentPlan.color === color;
                  return (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      className={`w-6 h-6 rounded-full relative flex items-center justify-center transition-shadow duration-200 ${
                        isSelected ? "ring-2 ring-white ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentPlan({ ...currentPlan, color })}
                      aria-label={`Seleccionar color ${color}`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Icono */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Icono
              </Text>
              <IconSelector
                selectedIcon={currentPlan?.icon || ""}
                onChange={(iconName) =>
                  setCurrentPlan((prev) =>
                    prev ? { ...prev, icon: iconName } : prev
                  )
                }
              />
            </div>
            {/* 🔹 Duración */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Duración
                <InfoPopover content="Esta duracion es calculada segun la cantidad de fases que requiera multiple" />
              </Text>
              <input
                type="text"
                readOnly
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm text-gray-700 text-center"
                value={`${currentPlan.duration} min ---> ${getFormattedDuration(
                  Number(currentPlan.duration)
                )}`}
              />
            </div>
            {/* 🔹 Fecha de Inicio */}
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Fecha y Hora de Inicio
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.start_date || ""}
                type="datetime-local"
                onChange={(e) => {
                  const start = e.target.value;
                  let end = "";

                  if (currentPlan?.duration) {
                    end = calculateEndDateRespectingWorkHours(
                      start,
                      Number(currentPlan.duration)
                    );
                  } else {
                    const fallback = new Date(start);
                    fallback.setHours(18, 0, 0, 0);
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    end = `${fallback.getFullYear()}-${pad(
                      fallback.getMonth() + 1
                    )}-${pad(fallback.getDate())}T${pad(
                      fallback.getHours()
                    )}:${pad(fallback.getMinutes())}`;
                  }

                  setCurrentPlan({
                    ...currentPlan,
                    start_date: start,
                    end_date: end,
                  });
                }}
              />
            </div>
            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Duración por fase
              </Text>
              <div className="w-full p-3 mt-2 text-sm text-gray-800 bg-gray-100 border rounded whitespace-pre-line">
                {currentPlan.duration_breakdown
                  ? formatDurationBreakdown(currentPlan.duration_breakdown)
                  : "Sin desglose disponible"}
              </div>
            </div>

            <div className="break-inside-avoid mb-4">
              <Text type="subtitle" color="#000">
                Fecha y Hora de Final
              </Text>
              <input
                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={currentPlan.end_date || ""}
                type="datetime-local"
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <Button
              onClick={() => setIsOpen(false)}
              variant="cancel"
              label="Cancelar"
            />
            {currentPlan?.status_dates !== "Planificación" &&
              currentPlan?.status_dates !== "En ejecución" &&
              currentPlan?.status_dates !== "Ejecutado" && (
                <Button
                  onClick={async () => {
                    if (isSaving) return;
                    setIsSaving(true);
                    try {
                      const updatedPlanWithStatus = {
                        ...currentPlan,
                        status_dates: "Planificación",
                      };
                      await handleSave(updatedPlanWithStatus);
                    } catch (err) {
                      console.error("Error al finalizar edición:", err);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  variant="terciario"
                  disabled={isSaving}
                  label={isSaving ? "Guardando..." : "Planificar y Guardar"}
                />
              )}
            <Button
              onClick={() => currentPlan && handleSave(currentPlan)}
              variant="save"
              label={isSaving ? "Guardando..." : "Actualizar"}
            />
          </div>
        </ModalSection>
      )}

      <Table
        columns={[
          "client_name",
          "number_order",
          "codart",
          "factory",
          "status_dates",
        ]}
        rows={planning}
        columnLabels={{
          client_name: "Cliente",
          number_order: "N° de orden",
          codart: "Artículo",
          factory: "Planta",
          status_dates: "Estado",
        }}
        onDelete={handleDelete}
        showDeleteButton={false}
        showTerciarioButton={true}
        showRestablecerButton={false}
        showControlButton={false}
        showViewButton={true}
        onEdit={handleEdit}
        onRestablecer={hableRestablecerOrden}
        onTerciario={handleTerciario}
        onControl={hableControlOrden}
        onView={obtenerActividades}
        onPDF={handlePDF}
        showTerciarioCondition={(row) =>
          row.status_dates === "Planificación" ||
          row.status_dates === "En ejecución"
        }
        showViewCondition={(row) =>
          row.status_dates === "Ejecutado" ||
          row.status_dates === "En ejecución"
        }
        showPDFCondition={(row) => row.status_dates === "Ejecutado"}
      />

      {/* Modal de control */}
      {showModalControl && (
        <ModalSection
          isVisible={showModalControl}
          onClose={() => setShowModalControl(false)}
        >
          <ModalControl
            id={25}
            showModal={showModalControl}
            setShowModal={setShowModalControl}
          />
        </ModalSection>
      )}
    </div>
  );
}

export default EditPlanning;
