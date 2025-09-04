"use client";
// importaciones de react y framer motion
import React, { useEffect, useState, useCallback } from "react";
// importaciones de componentes
import Table from "../table/Table";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import { InfoPopover } from "../buttons/InfoPopover";

// importaciones de interfaces
import {
  TipoAcondicionamiento,
  DataTipoAcondicionamiento,
  LineaTipoAcondicionamiento,
  DataLineaTipoAcondicionamiento,
} from "@/app/interfaces/NewTipoAcondicionamiento";
// importaciones de interfaces
import { Stage } from "@/app/interfaces/NewStage";
// importaciones de servicios
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

// función principal del componente
export default function NewTipoAcondicionamiento({
  canEdit = false,
  canView = false,
}: CreateClientProps) {
  // variables de estado
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [btnAplicar, setBtnAplicar] = useState(false);

  const [objectTipoAcom, setObjectTipoAcom] = useState<TipoAcondicionamiento>({
    id: 0,
    descripcion: "",
    status: false,
  });

  // ⬇️ Renombrado de "unknown" a algo que se entiende
  const [lineaForm, setLineaForm] = useState<LineaTipoAcondicionamiento>({
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

  // ✅ Una sola fuente de verdad para las líneas
  const [lineas, setLineas] = useState<DataLineaTipoAcondicionamiento[]>([]);
  const [listTipoAcom, setListTipoAcom] = useState<DataTipoAcondicionamiento[]>(
    []
  );
  const [listStages, setListStages] = useState<Stage[]>([]);
  const [listStagesControls, setListStagesControls] = useState<Stage[]>([]);

  // Helpers
  const getStageId = (id: string | number) =>
    listStages.find((item) => item.id === Number(id));

  // Captura de los datos del tipo de acondicionamiento
  const inputChangeObjectTipoAcom = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setObjectTipoAcom(
      (prev) =>
        ({
          ...prev,
          status: true,
          [e.target.name]: e.target.value,
        } as TipoAcondicionamiento)
    );
  };

  // captura de los datos de la línea (text/number)
  const inputChangeObjectLineaTipoAcom = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setLineaForm(
      (prev) =>
        ({
          ...prev,
          [name]: type === "number" && value !== "" ? Number(value) : value,
        } as LineaTipoAcondicionamiento)
    );
  };

  // captura de los datos de la línea (checkbox)
  const inputCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setLineaForm((prev) => ({ ...prev, [name]: checked }));
  };

  // función para crear un tipo de acondicionamiento
  const handleBtnAplicar = async () => {
    const response = await createTipoAcom(objectTipoAcom);
    if (response.status === 201) {
      // Vincula el nuevo ID al form de línea
      setLineaForm((prev) => ({
        ...prev,
        tipo_acondicionamiento_id: Number(response.id),
      }));
      setBtnAplicar(true);
      await getListTipoAcom();
    }
  };

  // función para crear una línea
  const handleBtnAgregarLinea = async () => {
    // Validar orden duplicado en memoria
    if (
      lineas.some(
        (l) =>
          Number(l.orden) === Number(lineaForm.orden) && l.id !== lineaForm.id
      )
    ) {
      alert(`Ya existe una línea con orden ${lineaForm.orden}`);
      return;
    }

    const response = await createLineaTipoAcom(lineaForm);
    if (response.status === 201) {
      // Refrescar desde backend
      const updated = await getLineaTipoAcomById(
        lineaForm.tipo_acondicionamiento_id
      );
      setLineas(updated);

      // Reset del formulario
      setLineaForm((prev) => ({
        ...prev,
        id: 0,
        orden: 0,
        descripcion: "",
        fase: "",
        editable: false,
        control: false,
        fase_control: "",
        descripcion_fase_control: "",
      }));
    }
  };

  // función para eliminar un tipo de acondicionamiento
  const handleDelete = async (id: number) => {
    showConfirm("¿Seguro que quieres eliminar esta fase?", async () => {
      try {
        await deleteTipoAcom(id);
        await getListTipoAcom(); // refresca solo después de borrar
      } catch (error) {
        console.error("Error al eliminar fase:", error);
        showError("Error al eliminar fase");
      }
    });
  };

  // función para eliminar una línea
  const handleDeleteLinea = async (id: number) => {
    try {
      // ✅ Sin eliminación optimista: eliminamos primero en backend
      await deleteLineaTipoAcom(Number(id));
    } catch {
      const was404 = "404";
      if (!was404) {
        showError(`No se pudo eliminar la línea`);
        return; // no sigas si el error es real
      }
      // Si fue 404, continuamos y refrescamos (tratamos como "ya estaba borrada")
    }

    // ✅ Refresco defensivo desde backend (asegura consistencia y reordenamientos)
    if (lineaForm.tipo_acondicionamiento_id) {
      try {
        const updated = await getLineaTipoAcomById(
          lineaForm.tipo_acondicionamiento_id
        );
        setLineas(updated);
      } catch {
        showError(`No se pudieron recargar las líneas`);
      }
    }
  };

  const handleBtnAplicarEdit = async () => {
    await updateTipoAcom(objectTipoAcom.id, objectTipoAcom);
    await getListTipoAcom();
    showSuccess("Tipo de Acondiciopnamiento Actualizado Correctamente");
  };

  // función para abrir el modal de edición+líneas
  const handleOpenEdit = async (id: number) => {
    await getListTipoAcomyLineas(id);
  };

  // lista de tipos
  const getListTipoAcom = useCallback(async () => {
    const response = await listTipoAcondicionamiento();
    setListTipoAcom(response);
  }, []);

  // tipos + líneas (para edición)
  const getListTipoAcomyLineas = async (id: number) => {
    const response = await getListTipoyLineas(id);
    setObjectTipoAcom(response.tipos);
    setLineaForm((prev) => ({
      ...prev,
      id: 0,
      tipo_acondicionamiento_id: response.tipos.id,
      orden: 0,
      descripcion: "",
      fase: "",
      editable: false,
      control: false,
      fase_control: "",
      descripcion_fase_control: "",
    }));
    setLineas(response.lineas); // ✅ una sola lista
    setIsOpenEdit(true);
  };

  // fases y controles
  const getSelectStages = useCallback(async () => {
    const response = await getSelectStagesControls();
    setListStages(response.fases);
    setListStagesControls(response.controles);
  }, []);

  // reset general
  const handleReset = () => {
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

  // Instancia del componente
  useEffect(() => {
    if (canView) {
      getListTipoAcom();
      getSelectStages();
    }
  }, [canView, getListTipoAcom, getSelectStages]);

  // Si desmarcas "control", vacía fase_control
  useEffect(() => {
    setLineaForm((prev) => ({
      ...prev,
      fase_control: prev.control ? prev.fase_control : "",
    }));
  }, [lineaForm.control]);

  // Renderización del componente
  return (
    <>
      {/* Bloque del componente 1 */}
      <div className="flex justify-center space-x-2 mb-2">
        {canEdit && (
          <Button
            onClick={() => setIsOpen(true)}
            variant="create"
            label="Crear"
          />
        )}
      </div>

      <div>
        {/* Tabla de tipos de acondicionamiento */}
        <Table
          columns={["descripcion", "status"]}
          rows={listTipoAcom}
          columnLabels={{
            descripcion: "Descripción",
            status: "Estado",
          }}
          onDelete={canEdit ? handleDelete : undefined}
          onEdit={handleOpenEdit}
        />
      </div>

      {/* Bloque del componente 2 */}
      <div>
        {/* Modal de creación y edición */}
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

            {/* Formulario principal */}
            <div className="mb-8">
              <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                Descripción{" "}
                {isOpenEdit ? (
                  ""
                ) : (
                  <InfoPopover
                    content={
                      <>
                        Al crear la descripción deberas editarla para poder
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

            {/* Tabla y formulario dinámico (solo si se aplicó el tipo base o estás editando) */}
            {(btnAplicar || isOpenEdit) && (
              <>
                <Text type="title" color="text-[rgb(var(--foreground))]">
                  Líneas de Acondicionamiento{" "}
                  <InfoPopover
                    content={
                      <>Los datos se guardan automaticamente al crearlos</>
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
                            <button
                              onClick={() => handleDeleteLinea(item.id)}
                              className="text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                              title="Eliminar línea"
                              disabled={!canEdit}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Fila de formulario */}
                      <tr className="bg-[rgb(var(--surface))] border-t border-[rgb(var(--border))] dark:bg-slate-900">
                        {/* Orden */}
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          <div className="flex justify-center items-center">
                            <input
                              type="number"
                              name="orden"
                              min={1}
                              value={
                                lineaForm.orden === 0 ? "" : lineaForm.orden
                              }
                              onChange={(e) => {
                                const newOrden = Number(e.target.value);
                                const isDuplicate = lineas.some(
                                  (item) =>
                                    Number(item.orden) === newOrden &&
                                    item.id !== lineaForm.id
                                );
                                if (isDuplicate) {
                                  alert(
                                    `Ya existe una línea con orden ${newOrden}`
                                  );
                                  return;
                                }
                                inputChangeObjectLineaTipoAcom(e);
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

                        {/* Descripción línea */}
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
                                setLineaForm({
                                  ...lineaForm,
                                  fase: e.target.value,
                                })
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

                              {/* Fase seleccionada pero no encontrada en la lista actual */}
                              {lineaForm.fase &&
                                !listStages.some(
                                  (item) => item.id === Number(lineaForm.fase)
                                ) && (
                                  <option value={lineaForm.fase}>
                                    {getStageId(lineaForm.fase)?.description ||
                                      "Fase desconocida"}
                                  </option>
                                )}

                              {/* Solo última versión por descripción */}
                              {listStages
                                .reduce((acc: Stage[], current: Stage) => {
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
                                        (item) =>
                                          item.description !==
                                          current.description
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
                                  // track
                                  "relative w-11 h-6 rounded-full transition-colors",
                                  "bg-[rgb(var(--surface-muted))] peer-checked:bg-[rgb(var(--accent))]",
                                  // focus y disabled via peer
                                  "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--ring))]",
                                  "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                                  // knob (usa ::after)
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

                        {/* Fase Control */}
                        <td className="px-4 py-3 border-r border-[rgb(var(--border))]">
                          <div className="flex justify-center items-center">
                            {lineaForm.control && (
                              <select
                                name="fase_control"
                                value={lineaForm.fase_control}
                                onChange={(e) =>
                                  setLineaForm({
                                    ...lineaForm,
                                    fase_control: e.target.value,
                                  })
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
                                {listStagesControls
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
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Acción agregar */}
                        <td className="px-4 py-3">
                          <div className="flex justify-center items-center">
                            <Button
                              onClick={handleBtnAgregarLinea}
                              variant="create"
                              label=""
                              disabled={!canEdit}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Acciones finales */}
            <hr className="my-4 w-full max-w-lg mx-auto opacity-60 border-t border-[rgb(var(--border))] dark:border-slate-700" />
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={handleReset} variant="cancel" label={"Cerrar"} />
              {canEdit && (
                <Button
                  onClick={() => {
                    if (isOpenEdit) {
                      handleBtnAplicarEdit();
                      handleReset();
                    } else {
                      handleBtnAplicar();
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
      </div>
    </>
  );
}
