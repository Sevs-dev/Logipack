"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  createStage,
  getStageId,
  updateStage,
  deleteStage,
  getStage,
} from "../../services/maestras/stageServices";
import { getActivitie } from "../../services/maestras/activityServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Table from "../table/Table";
import Button from "../buttons/buttons";
import { InfoPopover } from "../buttons/InfoPopover";
import { Stage, Data } from "../../interfaces/NewStage";
import Text from "../text/Text";
import { Search, Clock } from "lucide-react";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import { getRole } from "../../services/userDash/rolesServices";
import { Role } from "@/app/interfaces/CreateUser";
import DateLoader from "@/app/components/loader/DateLoader";
import SelectorDual from "../../components/SelectorDual/SelectorDual";
import { Input } from "../inputs/Input";
import { Toggle } from "../inputs/Toggle";

// ---------- Tipos ----------
const phases = [
  "Planificación",
  "Conciliación",
  "Control",
  "Actividades",
  "Procesos",
  "Testigo",
] as const;

type PhaseType = (typeof phases)[number];

interface ActivityApi {
  id: number;
  description: string;
  duration: number;
  binding?: number;

  // Pistas de orden que podrían venir del backend (no las usaremos para ordenar en FE)
  order?: number;
  position?: number;
  sort_index?: number;
  idx?: number;
  pivot?: {
    order?: number;
    position?: number;
    sort_index?: number;
    idx?: number;
  };
}

interface SelectedActivity {
  id: number;
  description: string;
  duration: number;
}

// Si tu interfaz Stage no incluye activities con este tipo union, lo extendemos internamente:
type StageWithActivities = Stage & {
  activities?: number[] | ActivityApi[] | null;
};

// ---------- Type Guards ----------
function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((x) => typeof x === "number");
}

function isActivityApiArray(value: unknown): value is ActivityApi[] {
  return (
    Array.isArray(value) &&
    value.every(
      (x) =>
        typeof x === "object" &&
        x !== null &&
        "id" in x &&
        typeof (x as { id: unknown }).id === "number"
    )
  );
}

function uniqueById<T extends { id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of arr) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

/**
 * Normalización estricta: respeta *exactamente* el orden del array guardado en DB.
 * - Acepta number[] o ActivityApi[].
 * - Mapea a las actividades disponibles por ID.
 * - Sin sort, sin pistas de orden, sin "inventar" elementos.
 * - Elimina duplicados preservando la primera aparición.
 */
function normalizeSelectedActivitiesStrict(
  raw: unknown,
  available: ActivityApi[]
): SelectedActivity[] {
  const byId = new Map<number, ActivityApi>(available.map((a) => [a.id, a]));

  let ids: number[] = [];
  if (isNumberArray(raw)) {
    ids = raw;
  } else if (isActivityApiArray(raw)) {
    ids = raw
      .map((x) => (typeof x.id === "number" ? x.id : null))
      .filter((v): v is number => v !== null);
  } else if (raw == null) {
    ids = [];
  } else {
    // Tipo inesperado → vacío (defensivo)
    ids = [];
  }

  const mapped = ids
    .map((id) => byId.get(id))
    .filter((a): a is ActivityApi => !!a)
    .map<SelectedActivity>((a) => ({
      id: a.id,
      description: a.description,
      duration: a.duration,
    }));

  return uniqueById(mapped);
}

function NewStage({ canEdit = false, canView = false }: CreateClientProps) {
  // === useState (Modal & Edición) ===
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  // === useState (Form inputs) ===
  const [description, setDescription] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [durationUser, setDurationUser] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [phaseType, setPhaseType] = useState<PhaseType | "">("");

  // === useState (Flags) ===
  const [repeat, setRepeat] = useState<boolean>(false);
  const [repeat_line, setrepeat_line] = useState<boolean>(false);
  const [repeatMinutes, setRepeatMinutes] = useState<string>("");
  const [alert, setAlert] = useState<boolean>(false);
  const [status, setStatus] = useState<boolean>(false);
  const [multi, setMulti] = useState<boolean>(false);
  const [canPause, setCanPause] = useState<boolean>(false);

  // === useState (Datos y selección) ===
  const [stage, setStage] = useState<Stage[]>([]);
  const [availableActivities, setAvailableActivities] = useState<ActivityApi[]>(
    []
  );
  const [selectedActivities, setSelectedActivities] = useState<
    SelectedActivity[]
  >([]);
  const [auditList, setAuditList] = useState<Audit[]>([]);
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  // === Fetchers ===
  const fetchStage = useCallback(async () => {
    try {
      const data = await getStage(); // tipa este servicio para que retorne Stage[]
      setStage(data);
    } catch {
      console.error("Error fetching stages:");
    }
  }, []);

  // === useEffects ===
  useEffect(() => {
    if (canView) void fetchStage();
  }, [canView, fetchStage]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activities = await getActivitie(); // tipar para ActivityApi[]
        setAvailableActivities(activities);
      } catch {
        showError("Error al cargar las actividades");
      }
    };

    if (
      phaseType === "Actividades" ||
      phaseType === "Control" ||
      phaseType === "Procesos" ||
      phaseType === "Testigo"
    ) {
      void fetchActivities();
    } else {
      setAvailableActivities([]);
      setSelectedActivities([]); // ← limpio al cambiar de tipo
    }
  }, [phaseType]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const role = await getRole(); // tipar para Role[]
        setRoles(role);
      } catch {
        showError("Error al cargar los roles");
      }
    };
    void fetchRoles();
  }, []);

  // Cargar actividades seleccionadas al abrir edición, respetando el orden guardado
  useEffect(() => {
    if (
      !isEditOpen ||
      !editingStage ||
      !(
        phaseType === "Actividades" ||
        phaseType === "Control" ||
        phaseType === "Procesos" ||
        phaseType === "Testigo"
      ) ||
      availableActivities.length === 0
    ) {
      return;
    }

    const rawActivities: number[] | ActivityApi[] | null | undefined = (
      editingStage as StageWithActivities
    ).activities;

    const normalized = normalizeSelectedActivitiesStrict(
      rawActivities,
      availableActivities
    );
    setSelectedActivities(normalized);
  }, [isEditOpen, availableActivities, editingStage, phaseType]);

  // Recalcular duración total desde las seleccionadas
  useEffect(() => {
    const total = selectedActivities.reduce<number>(
      (acc, act) => acc + (Number(act.duration) || 0),
      0
    );
    setDuration(String(total));
  }, [selectedActivities]);

  // === Validación ===
  const validateForm = (): boolean => {
    if (!description.trim()) {
      showError("La descripción es obligatoria.");
      return false;
    }
    if (!phaseType) {
      showError("El tipo de fase es obligatorio.");
      return false;
    }
    if (repeat && (!repeatMinutes || Number.isNaN(Number(repeatMinutes)))) {
      showError(
        "Por favor, ingresa un valor numérico válido para 'Repetir cada (min)'."
      );
      return false;
    }
    if (
      (phaseType === "Actividades" ||
        phaseType === "Control" ||
        phaseType === "Procesos" ||
        phaseType === "Testigo") &&
      selectedActivities.length === 0
    ) {
      showError("Debes seleccionar al menos una actividad.");
      return false;
    }
    return true;
  };

  // === Guardado ===
  const handleSave = async (): Promise<void> => {
    if (isSaving) return; // Evita múltiples envíos
    if (!validateForm()) return;
    setIsSaving(true); // Activa loading

    const base: Data = {
      description,
      phase_type: phaseType as string,
      repeat,
      repeat_line,
      repeat_minutes: repeat ? Number(repeatMinutes) : undefined,
      alert,
      can_pause: canPause,
      status,
      multi,
      duration_user: durationUser,
      role: selectedRoles.map((r) => r.name).join(","),
      duration,
      activities: [],
    };

    const payload: Data =
      phaseType === "Actividades" ||
      phaseType === "Control" ||
      phaseType === "Procesos" ||
      phaseType === "Testigo"
        ? { ...base, activities: selectedActivities.map((a) => a.id) }
        : base;

    try {
      const response = await createStage(payload);
      if ("status" in response && response.status === 201) {
        showSuccess("Fase creada con éxito");
        setIsOpen(false);
        void fetchStage();
        resetForm();
      } else {
        showError("Error al crear la fase");
      }
    } catch (error) {
      console.error("Error al guardar la fase:", error);
      showError("Ocurrió un error al guardar la fase");
    } finally {
      setIsSaving(false); // Desactiva loading
    }
  };

  // === Edición ===
  const handleEdit = async (id: number): Promise<void> => {
    try {
      const data = (await getStageId(id)) as StageWithActivities;
      setEditingStage(data);

      setDescription(data.description ?? "");
      setPhaseType(((data.phase_type ?? "") as PhaseType | "") || "");
      setRepeat(Boolean(data.repeat));
      setrepeat_line(Boolean(data.repeat_line));
      setRepeatMinutes(
        data.repeat_minutes !== null && data.repeat_minutes !== undefined
          ? String(data.repeat_minutes)
          : ""
      );
      setAlert(Boolean(data.alert));
      setStatus(Boolean(data.status));
      setMulti(Boolean(data.multi));
      setCanPause(Boolean(data.can_pause));

      // duration podría venir número o string o null → a string segura
      setDuration(
        data.duration !== null && data.duration !== undefined
          ? String(data.duration)
          : ""
      );

      // Evita romper <input type="number">
      setDurationUser(data.duration_user ?? "");

      // roles defensivo
      const rolesArray = data.role ? data.role.split(",") : [];
      const matchedRoles = roles.filter((r) => rolesArray.includes(r.name));
      setSelectedRoles(matchedRoles);

      setIsEditOpen(true);
    } catch {
      showError("Error obteniendo datos de la fase");
    }
  };

  // === Actualización ===
  const handleUpdate = async (): Promise<void> => {
    if (isSaving) return;
    if (!editingStage) return;
    setIsSaving(true);

    const activityIds =
      phaseType === "Actividades" ||
      phaseType === "Control" ||
      phaseType === "Procesos" ||
      phaseType === "Testigo"
        ? selectedActivities.map((a) => a.id)
        : [];

    const updatedStage: Data = {
      description,
      phase_type: phaseType as string,
      repeat: Boolean(repeat),
      repeat_line: Boolean(repeat_line),
      repeat_minutes: repeat ? Number(repeatMinutes) : undefined,
      alert: Boolean(alert),
      can_pause: Boolean(canPause),
      status: Boolean(status),
      multi: Boolean(multi),
      activities: activityIds,
      duration_user: durationUser ?? "",
      role: selectedRoles.map((r) => r.name).join(","),
      duration,
    };

    try {
      await updateStage(editingStage.id, updatedStage);
      showSuccess("Fase actualizada con éxito");
      setIsEditOpen(false);
      void fetchStage();
      resetForm();
    } catch (e) {
      console.error("Error al actualizar la fase:", e);
      showError("Ocurrió un error al actualizar la fase");
    } finally {
      setIsSaving(false); // Desactiva loading
    }
  };

  // === Eliminación ===
  const handleDelete = (id: number): void => {
    if (!canEdit) return;
    showConfirm("¿Seguro que quieres eliminar esta fase?", async () => {
      try {
        await deleteStage(id);
        setStage((prev) => prev.filter((s) => s.id !== id));
        showSuccess("Fase eliminada con éxito");
      } catch (e) {
        console.error("Error al eliminar fase:", e);
        showError("Error al eliminar fase");
      }
    });
  };

  // === Helpers ===
  const resetForm = (): void => {
    setDescription("");
    setPhaseType("");
    setRepeat(false);
    setRepeatMinutes("");
    setAlert(false);
    setStatus(false);
    setCanPause(false);
    setSelectedActivities([]);
    setDuration("");
    setDurationUser("");
    setMulti(false);
    setrepeat_line(false);
    setSelectedRoles([]);
    setSearchTerm("");
    setEditingStage(null);
  };

  const getFormattedDuration = (input: number | string): string => {
    let totalSeconds = 0;

    if (typeof input === "string") input = input.replace(",", ".");
    const num = typeof input === "number" ? input : parseFloat(input);

    if (Number.isNaN(num) || num <= 0) return "0 seg";

    // Si el número tiene decimales, los decimales son segundos (ej: 0.10 => 10 seg)
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

  // === Auditoría ===
  const handleHistory = async (id: number): Promise<void> => {
    const model = "Stage";
    try {
      const data = await getAuditsByModel(model, id); // tipar para Audit[]
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (e) {
      console.error("Error al obtener la auditoría:", e);
    }
  };

  // ---------- Render ----------
  return (
    <div>
      {/* Botón de crear fase */}
      {canEdit && (
        <div className="flex justify-center space-x-2 mb-2">
          <Button
            onClick={() => {
              resetForm();
              setEditingStage(null);
              setIsOpen(true);
            }}
            variant="create"
            label="Crear Fase"
          />
        </div>
      )}

      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {(isOpen || (isEditOpen && editingStage)) && (
        <ModalSection
          isVisible={isOpen || isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setIsOpen(false);
            resetForm();
          }}
        >
          <Text type="title" color="text-[rgb(var(--foreground))]">
            {editingStage ? "Editar Fase" : "Crear Fase"}
          </Text>

          <div className="space-y-4">
            {/* Descripción */}
            <div>
              <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                Descripción
              </Text>

              <Input
                placeholder="Descripción"
                tone="strong"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            {/* Tipo de Fase */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Tipo de Fase
                </Text>
                <select
                  value={phaseType}
                  onChange={(e) =>
                    setPhaseType(e.target.value as PhaseType | "")
                  }
                  className={[
                    "mt-1 w-full text-center p-2 rounded-lg",
                    "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] !border-[rgb(var(--border))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                  ].join(" ")}
                  disabled={!canEdit}
                >
                  <option value="" disabled>
                    Seleccione un tipo de Fase
                  </option>
                  {phases.map((phase) => (
                    <option
                      key={phase}
                      value={phase}
                      className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                    >
                      {phase}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-1/2">
                <SelectorDual
                  titulo="Rol"
                  disponibles={roles.filter(
                    (r) => !selectedRoles.some((sel) => sel.id === r.id)
                  )}
                  seleccionados={selectedRoles}
                  onAgregar={(rol: Role) =>
                    setSelectedRoles((prev) => [...prev, rol])
                  }
                  onQuitar={(id: number) =>
                    setSelectedRoles((prev) => prev.filter((r) => r.id !== id))
                  }
                />
              </div>
            </div>

            {/* Actividades */}
            {(phaseType === "Actividades" ||
              phaseType === "Control" ||
              phaseType === "Procesos" ||
              phaseType === "Testigo") && (
              <div className="space-y-4">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Actividades
                </Text>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Disponibles */}
                  <div className="w-full md:w-1/2">
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Disponibles
                    </Text>

                    <div className="mb-2">
                      <Input
                        size="sm"
                        className="text-left"
                        placeholder="Buscar actividad..."
                        leftIcon={
                          <Search className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>

                    <ul
                      className={[
                        "mt-1 p-2 rounded-lg max-h-48 overflow-y-auto custom-scroll",
                        "border !border-[rgb(var(--border))]",
                        "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]",
                      ].join(" ")}
                    >
                      {availableActivities
                        .filter((a) => a.binding === 1)
                        .filter((a) =>
                          a.description
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((activity) => {
                          const isAdded = selectedActivities.some(
                            (item) => item.id === activity.id
                          );
                          return (
                            <li
                              key={activity.id}
                              className="py-1 border-b border-[rgb(var(--border))] last:border-0"
                            >
                              <button
                                disabled={isAdded || !canEdit}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (isAdded) return;
                                  setSelectedActivities((prev) => [
                                    ...prev,
                                    {
                                      id: activity.id,
                                      description: activity.description,
                                      duration: activity.duration,
                                    },
                                  ]);
                                }}
                                className={[
                                  "w-full text-sm transition text-center",
                                  isAdded
                                    ? "text-[rgb(var(--foreground))]/40 cursor-not-allowed"
                                    : "text-[rgb(var(--accent))] hover:brightness-110",
                                ].join(" ")}
                              >
                                {activity.description}
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  {/* Seleccionadas */}
                  <div className="w-full md:w-1/2">
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Seleccionadas
                    </Text>
                    <ul
                      className={[
                        "mt-1 p-2 rounded-lg max-h-48 overflow-y-auto custom-scroll",
                        "border !border-[rgb(var(--border))]",
                        "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]",
                      ].join(" ")}
                    >
                      {selectedActivities.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex items-center justify-between py-1 border-b border-[rgb(var(--border))] last:border-0"
                        >
                          <span className="text-sm text-[rgb(var(--foreground))]">
                            {activity.description}
                          </span>
                          <button
                            className="text-red-500 hover:text-red-600 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-400/50"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedActivities((prev) =>
                                prev.filter((item) => item.id !== activity.id)
                              );
                            }}
                            disabled={!canEdit}
                          >
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Total de duración */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Tiempo Estimado
                  <InfoPopover
                    content={
                      <>
                        Tiempo calculado automáticamente por el{" "}
                        <strong>sistema</strong>.
                      </>
                    }
                  />
                </Text>
                <div className="mt-4 relative">
                  <Input
                    size="sm"
                    readOnly
                    className="pl-9 pr-24 cursor-default bg-[rgb(var(--surface-muted))]"
                    tone="strong"
                    leftIcon={
                      <Clock className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                    }
                    value={`${duration || "0"} minutos`}
                    disabled={!canEdit}
                  />
                  <span className="absolute right-7 top-2.5 text-sm text-[rgb(var(--foreground))]/70">
                    ({getFormattedDuration(Number(duration))})
                  </span>
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  T. Estimado Por El Usuario
                  <InfoPopover
                    content={
                      <>
                        Para segundos usa coma. Ej: <code>1,25</code> = 1 min 25
                        seg.
                      </>
                    }
                  />
                </Text>
                <div className="mt-4 relative">
                  <Input
                    size="sm"
                    type="number"
                    className="pl-9 text-left"
                    tone="strong"
                    leftIcon={
                      <Clock className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                    }
                    value={durationUser}
                    onChange={(e) => setDurationUser(e.target.value)}
                    disabled={!canEdit}
                  />
                  {durationUser && (
                    <span className="absolute right-7 top-2.5 text-sm text-[rgb(var(--foreground))]/70">
                      ({getFormattedDuration(Number(durationUser))})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones adicionales */}
            <hr className="my-4 w-full max-w-lg mx-auto opacity-60 border-t border-[rgb(var(--border))]" />
            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              {phaseType === "Control" && (
                <>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={repeat}
                      onCheckedChange={setRepeat}
                      disabled={!canEdit}
                      aria-label="Repetir"
                    />
                    <span className="text-sm text-[rgb(var(--foreground))]">
                      Repetir
                    </span>

                    {repeat && (
                      <Input
                        type="number"
                        placeholder="Cada (min)"
                        value={repeatMinutes}
                        onChange={(e) => setRepeatMinutes(e.target.value)}
                        size="sm"
                        className="min-w-[120px]"
                        disabled={!canEdit}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={alert}
                      onCheckedChange={setAlert}
                      disabled={!canEdit}
                      aria-label="Activar Alerta"
                    />
                    <span className="text-sm text-[rgb(var(--foreground))]">
                      Activar Alerta
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Toggle
                  checked={status}
                  onCheckedChange={setStatus}
                  disabled={!canEdit}
                  aria-label="Activar Fase"
                />
                <span className="text-sm text-[rgb(var(--foreground))]">
                  Activar Fase
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Toggle
                  checked={multi}
                  onCheckedChange={setMulti}
                  disabled={!canEdit}
                  aria-label="¿Mult. por unidades?"
                />
                <span className="text-sm text-[rgb(var(--foreground))]">
                  ¿Mult. por unidades?
                  <InfoPopover content="Si se activa, el sistema multiplica el tiempo según la cantidad de unidades. Ej: 3 unidades → 3x el tiempo." />
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Toggle
                  checked={canPause}
                  onCheckedChange={setCanPause}
                  disabled={!canEdit}
                  aria-label="¿Se puede pausar?"
                />
                <span className="text-sm text-[rgb(var(--foreground))]">
                  ¿Se puede pausar?
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Toggle
                  checked={repeat_line}
                  onCheckedChange={setrepeat_line}
                  disabled={!canEdit}
                  aria-label="Repetir Línea"
                />
                <span className="text-sm text-[rgb(var(--foreground))]">
                  Repetir Línea
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <hr className="my-4 w-full max-w-lg mx-auto opacity-60 border-t border-[rgb(var(--border))]" />
          <div className="flex justify-center gap-4 mt-6">
            <Button
              onClick={() => {
                if (editingStage) setIsEditOpen(false);
                else setIsOpen(false);
                resetForm();
              }}
              variant="cancel"
              label="Cancelar"
            />
            {canEdit && (
              <Button
                onClick={() =>
                  editingStage ? void handleUpdate() : void handleSave()
                }
                variant="create"
                disabled={
                  isSaving ||
                  !description.trim() ||
                  ((phaseType === "Actividades" ||
                    phaseType === "Control" ||
                    phaseType === "Procesos" ||
                    phaseType === "Testigo") &&
                    selectedActivities.length === 0)
                }
                label={
                  editingStage
                    ? "Actualizar"
                    : isSaving
                    ? "Guardando..."
                    : "Crear"
                }
              />
            )}
          </div>
        </ModalSection>
      )}
      {/* Tabla de fases */}
      <Table
        columns={["description", "phase_type", "status"]}
        rows={stage}
        columnLabels={{
          description: "Descripción",
          phase_type: "Tipo de Fase",
          status: "Estado",
        }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={handleEdit}
        onHistory={handleHistory}
      />
      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default NewStage;
