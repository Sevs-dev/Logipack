"use client";
import React, { useState, useEffect } from "react";
import {
  createActivitie,
  deleteActivitie,
  getActivitie,
  getActivitieId,
  updateActivitie,
} from "../../services/maestras/activityServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";
import { getRole } from "../../services/userDash/rolesServices";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Table from "../table/Table";
import { InfoPopover } from "../buttons/InfoPopover";
import {
  ActivityType,
  Activities,
  FormData,
} from "../../interfaces/NewActivity";
import Text from "../text/Text";
import { Clock } from "lucide-react";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import OptionsManager from "../inputs/OptionsManager";
import DateLoader from "@/app/components/loader/DateLoader";
import type { Role } from "../../interfaces/Role";
import { Input } from "../inputs/Input";
import { Toggle } from "../inputs/Toggle";

export default function NewActivity({
  canEdit = false,
  canView = false,
}: CreateClientProps) {
  const activityTypes: Record<string, ActivityType> = {
    "Texto corto": { type: "text" },
    "Texto largo": { type: "textarea" },
    Fecha: { type: "date" },
    // Adjunto: { type: "file" },
    Foto: { type: "image" },
    "Lista desplegable": { type: "select", options: ["Opción 1", "Opción 2"] },
    "Selección única": { type: "radio", options: [""] },
    "Selección múltiple": {
      type: "checkbox",
      options: ["Opción A", "Opción B"],
    },
    Firma: { type: "signature", signatureSpecific: false, allowedRoles: [] },
    Informativo: { type: "text", placeholder: "Escribe aquí..." },
    Rangos: {
      type: "temperature",
      min: undefined,
      max: undefined,
    },

    Muestreo: {
      type: "muestreo",
      clase: "",
      nivel: "",
      subnivel: "",
      items: [{ min: undefined, max: undefined, valor: undefined }],
    },
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState("Texto corto");
  const [formData, setFormData] = useState<FormData>({
    description: "",
    config: JSON.stringify(activityTypes["Texto corto"], null, 2),
    binding: false,
    has_time: false,
    duration: undefined,
  });

  const [activities, setActivities] = useState<Activities[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [parsedConfig, setParsedConfig] = useState<ActivityType | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const INPUT_TYPES_WITH_OPTIONS = ["select", "radio", "checkbox"];
  const getDefaultConfig = (type: string) =>
    JSON.stringify(
      activityTypes[type] || activityTypes["Texto corto"],
      null,
      2
    );
  const [auditList, setAuditList] = useState<Audit[]>([]);
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  // ────────────────────────────── HELPERS ──────────────────────────────

  const resetModalData = () => {
    setFormData({
      description: "",
      config: getDefaultConfig("Texto corto"),
      binding: false,
      has_time: false,
      duration: undefined,
    });
    setSelectedType("Texto corto");
    setOptions([]);
    setEditingId(null);
    setIsEditing(false);
  };

  const updateOptionsIfNeeded = (type: string, currentOptions: string[] = []) =>
    INPUT_TYPES_WITH_OPTIONS.includes(type) ? currentOptions : [];

  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      showError("La descripción es obligatoria");
      return false;
    }

    if (
      INPUT_TYPES_WITH_OPTIONS.includes(parsedConfig?.type || "") &&
      options.length === 0
    ) {
      showError("Debes agregar al menos una opción");
      return false;
    }

    // ✅ Si es firma específica, exige al menos un rol
    if (parsedConfig?.type === "signature" && parsedConfig.signatureSpecific) {
      const selected = parsedConfig.allowedRoles ?? [];
      if (selected.length === 0) {
        showError("Selecciona al menos un rol para la firma específica.");
        return false;
      }
    }

    return true;
  };

  // parsedConfig lo ya tienes; nos basamos en él:
  const isSignature = parsedConfig?.type === "signature";
  const isSpecificSignature = isSignature && !!parsedConfig?.signatureSpecific;

  // ────────────────────────────── EFFECTS ──────────────────────────────

  useEffect(() => {
    if (canView) fetchActivities();
  }, [canView]);

  useEffect(() => {
    try {
      setParsedConfig(JSON.parse(formData.config));
    } catch {
      setParsedConfig(null);
    }
  }, [formData.config]);

  useEffect(() => {
    const shouldLoad =
      modalOpen && selectedType === "Firma" && isSpecificSignature;
    if (!shouldLoad) return;

    (async () => {
      try {
        setLoadingRoles(true);
        const list = await getRole(); // asume [{id, name}]
        setRoles(Array.isArray(list) ? list : []);
      } catch {
        showError("No se pudieron cargar los roles.");
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [modalOpen, selectedType, isSpecificSignature]);

  // ────────────────────────────── API ──────────────────────────────

  const fetchActivities = async () => {
    try {
      const data = await getActivitie();
      setActivities(data);
    } catch {
      // handle error
    }
  };

  const getSerializedConfig = (): string => {
    try {
      const parsed = JSON.parse(formData.config);
      const finalConfig = {
        ...parsed,
        options: INPUT_TYPES_WITH_OPTIONS.includes(parsed.type)
          ? options
          : undefined,
      };
      return JSON.stringify(finalConfig, null, 2);
    } catch {
      showError("Error al generar la configuración de la actividad.");
      return formData.config; // fallback en caso de error
    }
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!validateForm()) return;
    setIsSaving(true);

    const config = getSerializedConfig();
    const payload = {
      description: formData.description,
      config,
      binding: formData.binding,
      has_time: formData.has_time,
      duration:
        typeof formData.duration === "number" && !isNaN(formData.duration)
          ? formData.duration
          : null,
    };

    try {
      if (isEditing && editingId !== null) {
        await updateActivitie(editingId, payload);
        showSuccess("Actividad actualizada correctamente");
      } else {
        await createActivitie(payload);
        showSuccess("Actividad creada exitosamente");
      }

      setModalOpen(false);
      fetchActivities();
      resetModalData();
    } catch {
      showError(
        isEditing
          ? "Error al actualizar actividad"
          : "Error al crear la actividad"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    showConfirm("¿Seguro que quieres eliminar esta Actividad?", async () => {
      try {
        await deleteActivitie(id);
        setActivities((prev) => prev.filter((a) => a.id !== id));
        showSuccess("Actividad eliminada con éxito");
      } catch {
        showError("Error al eliminar Actividad");
      }
    });
  };

  // ────────────────────────────── INPUT HANDLERS ──────────────────────────────

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const selected = activityTypes[type] || activityTypes["Texto corto"];
    const updatedConfig = JSON.stringify(selected, null, 2);
    setFormData({ ...formData, config: updatedConfig });
    if (selected.type) {
      setOptions(updateOptionsIfNeeded(selected.type, selected.options));
    }
  };

  // ────────────────────────────── EDICIÓN ──────────────────────────────

  // Mapea el type del config a la etiqueta del select
  const resolveTypeLabel = (cfg: ActivityType | null | undefined): string => {
    if (!cfg || !cfg.type) return "Texto corto";

    switch (cfg.type) {
      case "textarea":
        return "Texto largo";
      case "date":
        return "Fecha";
      // case "file":
      //   return "Adjunto";
      case "image":
        return "Foto";
      case "select":
        return "Lista desplegable";
      case "radio":
        return "Selección única";
      case "checkbox":
        return "Selección múltiple";
      case "signature":
        return "Firma";
      case "temperature":
        return "Rangos";
      case "muestreo":
        return "Muestreo";
      case "text":
        // Si viene con placeholder y SIN min/max, es “Informativo”
        if ("placeholder" in cfg && !("min" in cfg) && !("max" in cfg)) {
          return "Informativo";
        }
        // En cualquier otro caso de text, es “Texto corto”
        return "Texto corto";
      default:
        return "Texto corto";
    }
  };

  const handleEdit = async (id: number) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const data = await getActivitieId(id);

      const parsed: ActivityType =
        typeof data.config === "string" ? JSON.parse(data.config) : data.config;

      // 1) Etiqueta confiable
      const label = resolveTypeLabel(parsed);

      // 2) Opciones solo si aplica
      const opts = INPUT_TYPES_WITH_OPTIONS.includes(parsed.type || "")
        ? parsed.options ?? []
        : [];

      // 3) Setea estado
      setEditingId(Number(data.id));
      setFormData({
        description: data.description ?? "",
        config: JSON.stringify(parsed, null, 2),
        binding:
          data.binding === 1 || data.binding === true || data.binding === "1",
        has_time: !!data.has_time,
        duration:
          typeof data.duration === "number"
            ? data.duration
            : data.duration == null
            ? undefined
            : Number(data.duration),
      });
      setSelectedType(label);
      setOptions(opts);
      setIsEditing(true);
      setModalOpen(true);
    } catch {
      showError("Error obteniendo datos de la actividad");
    } finally {
      setIsSaving(false);
    }
  };

  // Convierte minutos.decimales a segundos y lo formatea legiblemente
  const getFormattedDuration = (input: number | string): string => {
    let totalSeconds = 0;

    if (typeof input === "string") input = input.replace(",", ".");
    const num = typeof input === "number" ? input : parseFloat(input);

    if (isNaN(num) || num <= 0) return "0 seg";

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

  // ────────────────────────────── MODAL ──────────────────────────────

  const handleModalClose = () => {
    setModalOpen(false);
    resetModalData();
  };

  const handleHistory = async (id: number) => {
    const model = "Activitie";
    try {
      const data = await getAuditsByModel(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]); // opción: mostrar la primera al abrir
    } catch {
      console.error("Error al obtener la auditoría:");
    }
  };

  return (
    <div>
      {/* Botón para abrir el modal de creación */}
      {canEdit && (
        <div className="flex justify-center space-x-2 mb-2">
          <Button
            onClick={() => {
              resetModalData();
              setModalOpen(true);
            }}
            variant="create"
            label="Crear Actividad"
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
      {/* Modal unificado para crear/editar */}
      {modalOpen && (
        <ModalSection isVisible={modalOpen} onClose={handleModalClose}>
          <div className="text-center">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              {isEditing ? "Editar Actividad" : "Crear Actividad"}
            </Text>
          </div>

          {/* Campo de descripción */}
          <div>
            <Text type="subtitle" color="text-[rgb(var(--foreground))]">
              Descripción
            </Text>
            <Input
              placeholder="Descripción"
              tone="strong"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={!canEdit && !isEditing}
            />
          </div>

          {/* Selector de tipo de actividad */}
          <div>
            <Text type="subtitle" color="text-[rgb(var(--foreground))]">
              Tipo de Actividad
            </Text>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className={[
                "w-full p-2 rounded-md mb-4 text-center",
                "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] !border-[rgb(var(--border))]",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
              ].join(" ")}
              disabled={!canEdit && !isEditing}
            >
              {Object.keys(activityTypes).map((type) => (
                <option
                  key={type}
                  value={type}
                  className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Opciones dinámicas */}
          {parsedConfig &&
            ["select", "radio", "checkbox"].includes(
              parsedConfig.type || ""
            ) && (
              <div className="mb-4">
                <h3 className="font-medium mb-2 text-[rgb(var(--foreground))]">
                  Opciones:
                </h3>
                <OptionsManager options={options} onChange={setOptions} />
              </div>
            )}

          {/* Firma específica (solo cuando el tipo es Firma) */}
          {selectedType === "Firma" && parsedConfig?.type === "signature" && (
            <div className="mt-5 space-y-4">
              {/* Toggle principal */}
              <div
                className={[
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  "bg-[rgb(var(--surface))] !border-[rgb(var(--border))]",
                  "hover:bg-[rgb(var(--surface-muted))]",
                ].join(" ")}
              >
                <Toggle
                  checked={!!parsedConfig.signatureSpecific}
                  onCheckedChange={(val) => {
                    const updated = {
                      ...parsedConfig,
                      type: "signature" as const,
                      signatureSpecific: val,
                      allowedRoles: val ? parsedConfig.allowedRoles ?? [] : [],
                    };
                    setFormData((prev) => ({
                      ...prev,
                      config: JSON.stringify(updated, null, 2),
                    }));
                  }}
                  disabled={!canEdit && !isEditing}
                  aria-label="Firma específica por rol"
                />
                <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                  Firma específica (por rol)
                </span>
                <InfoPopover
                  content={
                    <>
                      Si activas esta opción, solo usuarios con los roles
                      seleccionados podrán firmar.
                    </>
                  }
                />
              </div>

              {/* Selección de roles */}
              {parsedConfig.signatureSpecific && (
                <div
                  className={[
                    "border rounded-lg p-4 shadow-sm",
                    "bg-[rgb(var(--surface))] !border-[rgb(var(--border))]",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">
                    Selecciona los roles autorizados:
                  </p>

                  {loadingRoles ? (
                    <p className="text-sm text-[rgb(var(--muted-foreground))] italic">
                      Cargando roles…
                    </p>
                  ) : roles.length === 0 ? (
                    <p className="text-sm text-[rgb(var(--muted-foreground))] italic">
                      No hay roles disponibles.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                      {roles.map((r) => {
                        const checked = (
                          parsedConfig.allowedRoles ?? []
                        ).includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-[rgb(var(--surface-muted))] transition-colors"
                          >
                            <Toggle
                              checked={checked}
                              onCheckedChange={(val) => {
                                const prev = parsedConfig.allowedRoles ?? [];
                                const next = val
                                  ? [...prev, r.id]
                                  : prev.filter((id) => id !== r.id);
                                const updated = {
                                  ...parsedConfig,
                                  type: "signature" as const,
                                  signatureSpecific: true,
                                  allowedRoles: next,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  config: JSON.stringify(updated, null, 2),
                                }));
                              }}
                              disabled={!canEdit && !isEditing}
                              aria-label={`Rol ${r.name}`}
                              size="sm"
                            />
                            <span className="text-sm text-[rgb(var(--foreground))]">
                              {r.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contenedor para los tres elementos en fila */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
            {/* Requerido */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--foreground))]">
                Requerido
              </span>
              <Toggle
                checked={formData.binding}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, binding: v })
                }
                disabled={!canEdit && !isEditing}
                aria-label="Requerido"
              />
            </div>

            {/* Medir Tiempo */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--foreground))]">
                Medir Tiempo
              </span>
              <Toggle
                checked={formData.has_time}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, has_time: v })
                }
                disabled={!canEdit && !isEditing}
                aria-label="Medir Tiempo"
              />
            </div>

            {/* Duración */}
            {formData.has_time && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-[rgb(var(--foreground))] flex items-center gap-1">
                  Duración
                  <InfoPopover
                    content={
                      <>
                        Usa coma para segundos. Ej: <code>1,25</code> = 1 min 25
                        seg.
                      </>
                    }
                  />
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    size="sm"
                    tone="strong"
                    className="pl-9 w-[160px] text-left"
                    leftIcon={
                      <Clock className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                    }
                    placeholder="Minutos"
                    value={formData.duration ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      const parsed = parseFloat(raw);
                      setFormData({
                        ...formData,
                        duration:
                          raw === "" || isNaN(parsed) ? undefined : parsed,
                      });
                    }}
                    disabled={!canEdit && !isEditing}
                  />
                </div>
                <span
                  className={[
                    "rounded-lg py-1.5 px-3 text-sm h-[40px] flex items-center",
                    "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] !border-[rgb(var(--border))]",
                  ].join(" ")}
                >
                  ({getFormattedDuration(Number(formData.duration))})
                </span>
              </div>
            )}

            {/* Rango de temperatura */}
            {selectedType === "Rangos" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-[rgb(var(--foreground))] flex items-center gap-1">
                  Rangos de la temperatura a medir
                  <InfoPopover
                    content={
                      <>
                        Establece un rango numérico permitido. Mín debe ser &lt;
                        Máx.
                      </>
                    }
                  />
                </label>

                <Input
                  type="number"
                  step="0.1"
                  size="sm"
                  value={parsedConfig?.min ?? ""}
                  onChange={(e) => {
                    const updatedConfig = {
                      ...parsedConfig,
                      min: parseFloat(e.target.value),
                    };
                    setFormData({
                      ...formData,
                      config: JSON.stringify(updatedConfig, null, 2),
                    });
                  }}
                  placeholder="Mín"
                  tone="strong"
                  className="w-[100px] text-center"
                  disabled={!canEdit && !isEditing}
                />
                <Input
                  type="number"
                  step="0.1"
                  size="sm"
                  value={parsedConfig?.max ?? ""}
                  onChange={(e) => {
                    const updatedConfig = {
                      ...parsedConfig,
                      max: parseFloat(e.target.value),
                    };
                    setFormData({
                      ...formData,
                      config: JSON.stringify(updatedConfig, null, 2),
                    });
                  }}
                  placeholder="Máx"
                  tone="strong"
                  className="w-[100px] text-center"
                  disabled={!canEdit && !isEditing}
                />
              </div>
            )}

            {/* Muestreo */}
            {selectedType === "Muestreo" && (
              <div className="flex flex-col gap-4 w-full">
                <label className="text-sm font-medium text-[rgb(var(--foreground))] text-center">
                  Clasificación de inspección
                </label>

                <div className="flex gap-4 justify-center">
                  <select
                    className="p-2 rounded-md border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] !border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                    value={parsedConfig?.clase || ""}
                    onChange={(e) => {
                      const nuevaClase = e.target.value;
                      const nuevoNivel = "";
                      setFormData({
                        ...formData,
                        config: JSON.stringify(
                          {
                            ...parsedConfig,
                            clase: nuevaClase,
                            nivel: nuevoNivel,
                          },
                          null,
                          2
                        ),
                      });
                    }}
                  >
                    <option value="">Seleccionar clase</option>
                    <option value="especifico">Específico</option>
                    <option value="general">General</option>
                  </select>

                  <select
                    className="p-2 rounded-md border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] !border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                    value={parsedConfig?.nivel || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        config: JSON.stringify(
                          { ...parsedConfig, nivel: e.target.value },
                          null,
                          2
                        ),
                      });
                    }}
                    disabled={!parsedConfig?.clase}
                  >
                    <option value="">Seleccionar nivel</option>
                    {parsedConfig?.clase === "especifico" &&
                      ["S-1", "S-2", "S-3", "S-4"].map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                    {parsedConfig?.clase === "general" &&
                      ["I", "II", "III"].map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                  </select>

                  <select
                    className="p-2 rounded-md border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] !border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                    value={parsedConfig?.subnivel || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        config: JSON.stringify(
                          { ...parsedConfig, subnivel: e.target.value },
                          null,
                          2
                        ),
                      });
                    }}
                    disabled={!parsedConfig?.clase}
                  >
                    <option value="">Seleccionar subnivel</option>
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      .split("")
                      .slice(0, 18)
                      .map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                  </select>
                </div>

                <label className="text-sm font-medium text-[rgb(var(--foreground))] text-center">
                  Rangos de muestreo con valor
                  <InfoPopover
                    content={
                      <>
                        Agrega rangos con <code>min</code>, <code>max</code> y
                        su <code>valor</code>.
                      </>
                    }
                  />
                </label>

                {(parsedConfig?.items || []).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Input
                      type="number"
                      step="0.1"
                      size="sm"
                      value={item.min ?? ""}
                      onChange={(e) => {
                        const items = [...(parsedConfig?.items ?? [])];
                        items[index].min = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          config: JSON.stringify(
                            { ...parsedConfig, items },
                            null,
                            2
                          ),
                        });
                      }}
                      placeholder="Min"
                      className="w-[80px] text-center"
                      disabled={!canEdit && !isEditing}
                    />
                    <Input
                      type="number"
                      step="0.1"
                      size="sm"
                      value={item.max ?? ""}
                      onChange={(e) => {
                        const items = [...(parsedConfig?.items ?? [])];
                        items[index].max = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          config: JSON.stringify(
                            { ...parsedConfig, items },
                            null,
                            2
                          ),
                        });
                      }}
                      placeholder="Max"
                      className="w-[80px] text-center"
                      disabled={!canEdit && !isEditing}
                    />
                    <Input
                      type="number"
                      step="0.1"
                      size="sm"
                      value={item.valor ?? ""}
                      onChange={(e) => {
                        const items = [...(parsedConfig?.items ?? [])];
                        items[index].valor = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          config: JSON.stringify(
                            { ...parsedConfig, items },
                            null,
                            2
                          ),
                        });
                      }}
                      placeholder="Valor"
                      className="w-[80px] text-center"
                      disabled={!canEdit && !isEditing}
                    />
                    <Button
                      onClick={() => {
                        const items = (parsedConfig?.items ?? []).filter(
                          (_, i) => i !== index
                        );
                        setFormData({
                          ...formData,
                          config: JSON.stringify(
                            { ...parsedConfig, items },
                            null,
                            2
                          ),
                        });
                      }}
                      variant="cancel"
                      label="Eliminar"
                    />
                  </div>
                ))}

                <Button
                  variant="add"
                  label="Agregar Muestreo"
                  onClick={() => {
                    const items = [
                      ...(parsedConfig?.items || []),
                      { min: undefined, max: undefined, valor: undefined },
                    ];
                    setFormData({
                      ...formData,
                      config: JSON.stringify(
                        { ...parsedConfig, items },
                        null,
                        2
                      ),
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <hr className="my-4 w-full max-w-lg mx-auto opacity-60 border-t border-[rgb(var(--border))]" />
          <div className="flex justify-center gap-4 mt-6">
            <Button
              onClick={handleModalClose}
              variant="cancel"
              label="Cancelar"
            />
            {canEdit && (
              <Button
                onClick={handleSubmit}
                variant="create"
                disabled={isSaving}
                label={
                  isEditing ? "Guardar" : isSaving ? "Guardando..." : "Crear"
                }
              />
            )}
          </div>
        </ModalSection>
      )}

      {/* Tabla de actividades */}
      <Table
        columns={["description", "binding"]}
        rows={activities}
        columnLabels={{
          description: "Descripción",
          binding: "Obligatorio",
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
