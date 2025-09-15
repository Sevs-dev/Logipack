// NewTipoAcondicionamiento.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";

// UI
import Table from "../table/Table";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import { InfoPopover } from "../buttons/InfoPopover";

// Props
import { CreateClientProps } from "../../interfaces/CreateClientProps";

// Tipos de dominio
import {
  TipoAcondicionamiento,
  DataTipoAcondicionamiento,
  LineaTipoAcondicionamiento,
  DataLineaTipoAcondicionamiento,
} from "@/app/interfaces/NewTipoAcondicionamiento";
import { Stage } from "@/app/interfaces/NewStage";

// Servicios (respuestas tipadas aquí, sin any)
import {
  createStage as createTipoAcom,
  getStage as listTipoAcondicionamiento,
  deleteStage as deleteTipoAcom,
  updateTipoAcondicionamiento as updateTipoAcom,
} from "@/app/services/maestras/TipoAcondicionamientoService";
import {
  createStage as createLineaTipoAcom,
  deleteStage as deleteLineaTipoAcom,
  getLineaTipoAcondicionamientoById as getLineaTipoAcomById,
  getListTipoyLineas as getListTipoyLineas,
  getSelectStagesControls as getSelectStagesControls,
} from "@/app/services/maestras/LineaTipoAcondicionamientoService";

// ==== Tipos auxiliares para respuestas de servicios (evitan any) ====
interface CreateTipoResponse {
  status: number;
  id: number;
}
interface CreateLineaResponse {
  status: number;
}
interface ListTipoYLineasResponse {
  tipos: TipoAcondicionamiento;
  lineas: DataLineaTipoAcondicionamiento[];
}
interface StagesControlsResponse {
  fases: Stage[];
  controles: Stage[];
}

// ==== Helpers fuertemente tipados ====

// Obtiene la fase por id desde la lista en memoria
const getStageById = (list: Stage[], id: string | number): Stage | undefined =>
  list.find((item) => item.id === Number(id));

// Siguiente número de orden sugerido (máximo actual + 1)
const getNextOrden = (arr: DataLineaTipoAcondicionamiento[]): number => {
  const max = arr.reduce<number>((m, x) => {
    const v = Number(x.orden) || 0;
    return v > m ? v : m;
  }, 0);
  return max + 1;
};

// Valida que el orden sea entero >= 1
const isValidOrden = (value: number): boolean =>
  Number.isFinite(value) && Number.isInteger(value) && value >= 1;

// ==== Componente principal ====
export default function NewTipoAcondicionamiento({
  canEdit = false,
  canView = false,
}: CreateClientProps): JSX.Element {
  // Estado de UI (modales / botones)
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenEdit, setIsOpenEdit] = useState<boolean>(false);
  const [btnAplicar, setBtnAplicar] = useState<boolean>(false);

  // Tipo de acondicionamiento (cabecera)
  const [objectTipoAcom, setObjectTipoAcom] = useState<TipoAcondicionamiento>({
    id: 0,
    descripcion: "",
    status: false,
  });

  // Formulario de línea en edición/creación
  const [lineaForm, setLineaForm] = useState<LineaTipoAcondicionamiento>({
    id: 0,
    tipo_acondicionamiento_id: 0,
    orden: 0, // ⚠️ es number, nunca string vacío
    descripcion: "",
    fase: "",
    descripcion_fase: "",
    editable: false,
    control: false,
    fase_control: "",
    descripcion_fase_control: "",
  });

  // Listas maestras en memoria
  const [lineas, setLineas] = useState<DataLineaTipoAcondicionamiento[]>([]);
  const [listTipoAcom, setListTipoAcom] = useState<DataTipoAcondicionamiento[]>(
    []
  );
  const [listStages, setListStages] = useState<Stage[]>([]);
  const [listStagesControls, setListStagesControls] = useState<Stage[]>([]);

  // ==== Handlers de inputs ====

  // Cambios en cabecera (tipo de acondicionamiento)
  const inputChangeObjectTipoAcom = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setObjectTipoAcom((prev) => ({
      ...prev,
      status: true,
      [name]: value,
    }));
  };

  // Cambios en línea (inputs text/number): nunca guardamos "" en un number
  const inputChangeObjectLineaTipoAcom = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value, type } = e.target;

    setLineaForm(
      (prev) =>
        ({
          ...prev,
          [name]:
            type === "number"
              ? value === ""
                ? 0
                : Number(value) // ⬅️ normalización numérica
              : value,
        } as LineaTipoAcondicionamiento)
    );
  };

  // Cambios en switches/checkbox
  const inputCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, checked } = e.target;
    setLineaForm((prev) => ({ ...prev, [name]: checked }));
  };

  // Si se desmarca "control", vaciamos fase_control (coherencia)
  useEffect(() => {
    setLineaForm((prev) => ({
      ...prev,
      fase_control: prev.control ? prev.fase_control : "",
    }));
  }, [lineaForm.control]);

  // ==== Acciones (CRUD) ====

  // Crear tipo de acondicionamiento base
  const handleBtnAplicar = async (): Promise<void> => {
    const response = (await createTipoAcom(
      objectTipoAcom
    )) as CreateTipoResponse;

    if (response.status === 201) {
      // Vinculamos ID devuelto al formulario de línea
      setLineaForm((prev) => ({
        ...prev,
        tipo_acondicionamiento_id: Number(response.id),
      }));
      setBtnAplicar(true);
      await getListTipoAcom();
      showSuccess("Tipo de Acondicionamiento creado");
    }
  };

  // Crear línea (validando recién aquí para no bloquear la escritura)
  const handleBtnAgregarLinea = async (): Promise<void> => {
    const normalizedOrden = Number(lineaForm.orden);

    // 1) Validación de orden
    if (!isValidOrden(normalizedOrden)) {
      showError("El orden debe ser un entero ≥ 1.");
      return;
    }

    // 2) Validación de duplicado real (ya con número completo)
    const isDuplicate = lineas.some(
      (l) => Number(l.orden) === normalizedOrden && l.id !== lineaForm.id
    );
    if (isDuplicate) {
      showError(`Ya existe una línea con orden ${normalizedOrden}`);
      return;
    }

    // 3) Guardar en backend
    const response = (await createLineaTipoAcom({
      ...lineaForm,
      orden: normalizedOrden, // guardamos normalizado
    })) as CreateLineaResponse;

    if (response.status === 201) {
      // 4) Refrescamos desde backend para mantener consistencia
      const updated = (await getLineaTipoAcomById(
        lineaForm.tipo_acondicionamiento_id
      )) as DataLineaTipoAcondicionamiento[];

      setLineas(updated);

      // 5) UX: sugerir siguiente orden disponible
      const nextOrden = getNextOrden(updated);

      // 6) Reset del form de línea
      setLineaForm((prev) => ({
        ...prev,
        id: 0,
        orden: nextOrden,
        descripcion: "",
        fase: "",
        editable: false,
        control: false,
        fase_control: "",
        descripcion_fase_control: "",
      }));

      showSuccess("Línea creada correctamente");
    }
  };

  // Eliminar tipo de acondicionamiento
  const handleDelete = async (id: number): Promise<void> => {
    showConfirm("¿Seguro que quieres eliminar esta fase?", async () => {
      try {
        await deleteTipoAcom(id);
        await getListTipoAcom();
        showSuccess("Fase eliminada");
      } catch (error: unknown) {
        console.error("Error al eliminar fase:", error);
        showError("Error al eliminar fase");
      }
    });
  };

  // Eliminar línea
  const handleDeleteLinea = async (id: number): Promise<void> => {
    try {
      await deleteLineaTipoAcom(Number(id));
    } catch {
      showError("No se pudo eliminar la línea");
      return;
    }

    if (lineaForm.tipo_acondicionamiento_id) {
      try {
        const updated = (await getLineaTipoAcomById(
          lineaForm.tipo_acondicionamiento_id
        )) as DataLineaTipoAcondicionamiento[];
        setLineas(updated);
        showSuccess("Línea eliminada");
      } catch {
        showError("No se pudieron recargar las líneas");
      }
    }
  };

  // Actualizar cabecera
  const handleBtnAplicarEdit = async (): Promise<void> => {
    await updateTipoAcom(objectTipoAcom.id, objectTipoAcom);
    await getListTipoAcom();
    showSuccess("Tipo de Acondicionamiento actualizado correctamente");
  };

  // Abrir modal de edición: carga tipos + líneas
  const handleOpenEdit = async (id: number): Promise<void> => {
    await getListTipoAcomyLineas(id);
  };

  // ==== Cargas de listas ====

  // Tipos (lista principal)
  const getListTipoAcom = useCallback(async (): Promise<void> => {
    const response =
      (await listTipoAcondicionamiento()) as DataTipoAcondicionamiento[];
    setListTipoAcom(response);
  }, []);

  // Tipo + líneas para edición
  const getListTipoAcomyLineas = async (id: number): Promise<void> => {
    const response = (await getListTipoyLineas(id)) as ListTipoYLineasResponse;

    setObjectTipoAcom(response.tipos);

    // Prepara el form de línea en blanco, con el tipo ya asociado
    const nextOrden = getNextOrden(response.lineas);
    setLineaForm((prev) => ({
      ...prev,
      id: 0,
      tipo_acondicionamiento_id: response.tipos.id,
      orden: nextOrden,
      descripcion: "",
      fase: "",
      editable: false,
      control: false,
      fase_control: "",
      descripcion_fase_control: "",
    }));

    setLineas(response.lineas);
    setIsOpenEdit(true);
  };

  // Fases y fases de control
  const getSelectStages = useCallback(async (): Promise<void> => {
    const response =
      (await getSelectStagesControls()) as StagesControlsResponse;
    setListStages(response.fases);
    setListStagesControls(response.controles);
  }, []);

  // ==== Reset general ====
  const handleReset = (): void => {
    setIsOpen(false);
    setIsOpenEdit(false);
    setBtnAplicar(false);

    setObjectTipoAcom({
      id: 0,
      descripcion: "",
      status: false,
    });

    setLineaForm({
      id: 0,
      tipo_acondicionamiento_id: 0,
      orden: 0,
      descripcion: "",
      fase: "",
      descripcion_fase: "",
      editable: false,
      control: false,
      fase_control: "",
      descripcion_fase_control: "",
    });

    setLineas([]);
  };

  // ==== Efectos de montaje ====
  useEffect(() => {
    if (canView) {
      void getListTipoAcom();
      void getSelectStages();
    }
  }, [canView, getListTipoAcom, getSelectStages]);

  // ==== VALIDACIÓN PARA HABILITAR/DESHABILITAR EL BOTÓN “+” ====

  // ¿Existe duplicado de orden con lo que hay escrito? (no bloquea, solo deshabilita)
  const isDuplicateOrden = useMemo(
    () =>
      lineas.some(
        (l) =>
          Number(l.orden) === Number(lineaForm.orden) && l.id !== lineaForm.id
      ),
    [lineas, lineaForm.orden, lineaForm.id]
  );

  // Campos mínimos completos
  const hasTipo = lineaForm.tipo_acondicionamiento_id > 0;
  const hasOrdenValido = isValidOrden(Number(lineaForm.orden));
  const hasDescripcion = lineaForm.descripcion.trim().length > 0;
  const hasFase = String(lineaForm.fase).trim().length > 0;
  const hasFaseControl =
    !lineaForm.control || String(lineaForm.fase_control).trim().length > 0;

  // ¿Se puede crear la línea?
  const canAddLinea = useMemo(
    () =>
      canEdit &&
      hasTipo &&
      hasOrdenValido &&
      !isDuplicateOrden &&
      hasDescripcion &&
      hasFase &&
      hasFaseControl,
    [
      canEdit,
      hasTipo,
      hasOrdenValido,
      isDuplicateOrden,
      hasDescripcion,
      hasFase,
      hasFaseControl,
    ]
  );

  // Motivo (tooltip) cuando está deshabilitado (primer bloqueo que encuentre)
  const addDisabledReason: string | undefined = useMemo(() => {
    if (!canEdit) return "No tienes permisos para editar.";
    if (!hasTipo) return "Aplica o edita un tipo primero.";
    if (!hasOrdenValido) return "El orden debe ser un entero ≥ 1.";
    if (isDuplicateOrden)
      return `Ya existe una línea con orden ${lineaForm.orden}.`;
    if (!hasDescripcion) return "Falta la descripción de la línea.";
    if (!hasFase) return "Selecciona una fase.";
    if (!hasFaseControl) return "Selecciona una fase de control.";
    return undefined;
  }, [
    canEdit,
    hasTipo,
    hasOrdenValido,
    isDuplicateOrden,
    lineaForm.orden,
    hasDescripcion,
    hasFase,
    hasFaseControl,
  ]);

  // ==== Render ====
  return (
    <>
      {/* Acciones superiores */}
      <div className="flex justify-center space-x-2 mb-2">
        {canEdit && (
          <Button
            onClick={() => setIsOpen(true)}
            variant="create"
            label="Crear"
          />
        )}
      </div>

      {/* Tabla de tipos (lista) */}
      <div>
        <Table
          columns={["descripcion", "status"]}
          rows={listTipoAcom}
          columnLabels={{ descripcion: "Descripción", status: "Estado" }}
          onDelete={canEdit ? handleDelete : undefined}
          onEdit={handleOpenEdit}
        />
      </div>

      {/* Modal de creación/edición */}
      {(isOpen || isOpenEdit) && (
        <ModalSection
          isVisible={isOpen || isOpenEdit}
          onClose={() => {
            if (isOpenEdit) {
              handleReset();
            } else {
              setIsOpen(false);
            }
            setIsOpenEdit(false);
          }}
        >
          {/* Título */}
          <Text type="title" color="text-[rgb(var(--foreground))]">
            {isOpenEdit
              ? "Editar Tipo de Orden de Acondicionamiento"
              : "Crear Nuevo Tipo de Acondicionamiento"}
          </Text>

          {/* Cabecera / descripción */}
          <div className="mb-8">
            <Text type="subtitle" color="text-[rgb(var(--foreground))]">
              Descripción{" "}
              {isOpenEdit ? (
                ""
              ) : (
                <InfoPopover
                  content={
                    <>
                      Al crear la descripción deberás editarla para poder
                      guardar los datos necesarios.
                    </>
                  }
                />
              )}
            </Text>

            <input
              id="descripcion"
              type="text"
              name="descripcion"
              value={objectTipoAcom.descripcion}
              onChange={inputChangeObjectTipoAcom}
              disabled={btnAplicar || !canEdit}
              className={[
                "w-full px-4 py-2 rounded-md text-center",
                "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                "placeholder:text-[rgb(var(--foreground))]/50",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
              ].join(" ")}
              placeholder="Ejemplo: Revisión técnica"
            />
          </div>

          {/* Líneas (solo cuando ya existe el tipo o estamos en edición) */}
          {(btnAplicar || isOpenEdit) && (
            <>
              <Text type="title" color="text-[rgb(var(--foreground))]">
                Líneas de Acondicionamiento{" "}
                <InfoPopover
                  content={
                    <>Los datos se guardan automáticamente al crearlos.</>
                  }
                />
              </Text>

              <div className="overflow-x-auto rounded-lg border border-[rgb(var(--border))] shadow-sm dark:border-slate-700">
                <table className="min-w-full text-center border border-[rgb(var(--border))] text-[rgb(var(--foreground))] dark:border-slate-700">
                  <thead className="bg-[rgb(var(--surface-muted))] border-b border-[rgb(var(--border))] dark:bg-slate-800/70 dark:border-slate-700">
                    <tr className="border-b border-[rgb(var(--border))]">
                      {[
                        "Orden",
                        "Descripción",
                        "Fase",
                        "Actividades en Proceso",
                        "Control",
                        "Fase Control",
                        "Acciones",
                      ].map((th) => (
                        <th
                          key={th}
                          className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[rgb(var(--foreground))]/70 border-r last:border-r-0 border-[rgb(var(--border))]"
                        >
                          {th}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {/* Filas existentes */}
                    {lineas.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[rgb(var(--surface-muted))] transition-colors border-b border-[rgb(var(--border))] dark:hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          {item.orden}
                        </td>
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          {item.descripcion}
                        </td>
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          {item.descripcion_fase}
                        </td>
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          {item.editable ? "Sí" : "No"}
                        </td>
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          {item.control ? "Sí" : "No"}
                        </td>
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          {item.descripcion_fase_control || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            onClick={() => void handleDeleteLinea(item.id)}
                            variant="cancel"
                            label={"Eliminar"}
                          />
                        </td>
                      </tr>
                    ))}

                    {/* Fila de creación */}
                    <tr className="bg-[rgb(var(--surface))] border-t border-[rgb(var(--border))] dark:bg-slate-900">
                      {/* Orden */}
                      <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                        <div className="flex justify-center items-center">
                          <input
                            type="number"
                            name="orden"
                            min={1}
                            // UX: si es 0 mostramos vacío, pero guardamos 0 en estado
                            value={lineaForm.orden === 0 ? "" : lineaForm.orden}
                            onChange={(e) => {
                              // 👇 No validamos aquí duplicados para no bloquear mientras escribe (1 -> 10)
                              inputChangeObjectLineaTipoAcom(e);
                            }}
                            onBlur={(e) => {
                              // (Opcional) Feedback suave al salir del input
                              const v = Number(e.target.value);
                              if (!isValidOrden(v)) {
                                showError("El orden debe ser un entero ≥ 1.");
                                return;
                              }
                              const dup = lineas.some(
                                (item) =>
                                  Number(item.orden) === v &&
                                  item.id !== lineaForm.id
                              );
                              if (dup)
                                showError(`Ya existe una línea con orden ${v}`);
                            }}
                            placeholder="N°"
                            className={[
                              "w-full px-3 py-2 rounded-md text-center",
                              "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                              "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                            ].join(" ")}
                            disabled={!canEdit}
                          />
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                        <input
                          type="text"
                          name="descripcion"
                          placeholder="Descripción"
                          value={lineaForm.descripcion}
                          onChange={inputChangeObjectLineaTipoAcom}
                          className={[
                            "w-full px-3 py-2 rounded-md text-center",
                            "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                          ].join(" ")}
                          disabled={!canEdit}
                        />
                      </td>

                      {/* Fase */}
                      <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                        <div className="flex justify-center items-center">
                          <select
                            name="fase"
                            value={lineaForm.fase}
                            onChange={(e) =>
                              setLineaForm((prev) => ({
                                ...prev,
                                fase: e.target.value,
                              }))
                            }
                            className={[
                              "w-full px-3 py-2 rounded-md text-center",
                              "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                              "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                            ].join(" ")}
                            disabled={!canEdit}
                          >
                            <option value="">Seleccione una fase</option>

                            {/* Si hay fase previamente seleccionada pero no existe en la lista actual */}
                            {lineaForm.fase &&
                              !listStages.some(
                                (item) => item.id === Number(lineaForm.fase)
                              ) && (
                                <option value={lineaForm.fase}>
                                  {getStageById(listStages, lineaForm.fase)
                                    ?.description || "Fase desconocida"}
                                </option>
                              )}

                            {/* Solo última versión por descripción, excluyendo controles */}
                            {listStages
                              .reduce<Stage[]>((acc, current) => {
                                const existing = acc.find(
                                  (item) =>
                                    item.description === current.description
                                );
                                if (
                                  !existing ||
                                  Number(current.version) >
                                    Number(existing.version)
                                ) {
                                  return [
                                    ...acc.filter(
                                      (i) =>
                                        i.description !== current.description
                                    ),
                                    current,
                                  ];
                                }
                                return acc;
                              }, [])
                              .filter((item) => item.phase_type !== "Control")
                              .sort((a, b) =>
                                a.description.localeCompare(b.description)
                              )
                              .map((item) => (
                                <option
                                  key={item.id}
                                  value={item.id}
                                  className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                                >
                                  {item.description}
                                  {Number(item.version) > 1
                                    ? ` (v${item.version})`
                                    : ""}
                                </option>
                              ))}
                          </select>
                        </div>
                      </td>

                      {/* Editable (switch) */}
                      <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                        <div className="flex justify-center items-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="editable"
                              checked={lineaForm.editable}
                              onChange={inputCheckboxChange}
                              className="sr-only peer"
                              disabled={!canEdit}
                            />
                            <div
                              className={[
                                "relative w-11 h-6 rounded-full transition-colors",
                                "bg-[rgb(var(--surface-muted))] peer-checked:bg-[rgb(var(--accent))]",
                                "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--ring))]",
                                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                                "after:content-[''] after:absolute after:top-0.5 after:left-[2px]",
                                "after:h-5 after:w-5 after:rounded-full after:transition-transform",
                                "after:bg-[rgb(var(--surface))] after:border after:border-[rgb(var(--border))]",
                                "peer-checked:after:translate-x-full",
                              ].join(" ")}
                            />
                          </label>
                        </div>
                      </td>

                      {/* Control (switch) */}
                      <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                        <div className="flex justify-center items-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="control"
                              checked={lineaForm.control}
                              onChange={inputCheckboxChange}
                              className="sr-only peer"
                              disabled={!canEdit}
                            />
                            <div
                              className={[
                                "relative w-11 h-6 rounded-full transition-colors",
                                "bg-[rgb(var(--surface-muted))] peer-checked:bg-[rgb(var(--accent))]",
                                "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--ring))]",
                                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                                "after:content-[''] after:absolute after:top-0.5 after:left-[2px]",
                                "after:h-5 after:w-5 after:rounded-full after:transition-transform",
                                "after:bg-[rgb(var(--surface))] after:border after:border-[rgb(var(--border))]",
                                "peer-checked:after:translate-x-full",
                              ].join(" ")}
                            />
                          </label>
                        </div>
                      </td>

                      {/* Fase Control (solo si control=true) */}
                      <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                        <div className="flex justify-center items-center">
                          {lineaForm.control && (
                            <select
                              name="fase_control"
                              value={String(lineaForm.fase_control ?? "")} // <- normalizamos a string
                              onChange={(e) =>
                                setLineaForm((prev) => ({
                                  ...prev,
                                  // si necesitas number en el estado, usa Number(e.target.value)
                                  fase_control: e.target.value,
                                }))
                              }
                              disabled={!canEdit}
                              className={[
                                "w-full px-3 py-2 rounded-md text-center",
                                "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                                "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                              ].join(" ")}
                            >
                              <option value="">
                                Seleccione una fase control
                              </option>

                              {(Array.isArray(listStagesControls)
                                ? [...listStagesControls]
                                : []
                              )
                                .sort((a, b) =>
                                  (a?.description ?? "").localeCompare(
                                    b?.description ?? ""
                                  )
                                )
                                .map((item) => {
                                  const label =
                                    `${
                                      item?.description ?? "Sin descripción"
                                    } · v${item?.version ?? "?"}`  

                                  return (
                                    <option
                                      key={item.id}
                                      value={String(item.id)}  
                                      className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                                    >
                                      {label}
                                    </option>
                                  );
                                })}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Acción agregar */}
                      <td className="px-4 py-3">
                        <div
                          className="flex justify-center items-center"
                          // Tooltip nativo con la razón si está deshabilitado
                          title={addDisabledReason}
                        >
                          <Button
                            onClick={() => void handleBtnAgregarLinea()}
                            variant="create"
                            label="" // tu botón de “+”
                            disabled={!canAddLinea} // ⬅️ DESHABILITADO si faltan datos / duplicado / sin permisos
                            // Si tu Button soporta aria-*, esto ayuda a accesibilidad:
                            aria-disabled={!canAddLinea}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Acciones finales del modal */}
          <hr className="my-4 w-full max-w-lg mx-auto opacity-60 border-t border-[rgb(var(--border))] dark:border-slate-700" />
          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={handleReset} variant="cancel" label={"Cerrar"} />
            {canEdit && (
              <Button
                onClick={() => {
                  if (isOpenEdit) {
                    void handleBtnAplicarEdit();
                    handleReset();
                  } else {
                    void handleBtnAplicar();
                    handleReset();
                  }
                }}
                variant="create"
                label={isOpenEdit ? "Actualizar" : "Guardar"}
              />
            )}
          </div>
        </ModalSection>
      )}
    </>
  );
}
