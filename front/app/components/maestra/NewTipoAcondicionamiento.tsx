"use client";
// importaciones de react y framer motion
import React, { useEffect, useState, useCallback } from "react";
// importaciones de componentes
import Table from "../table/Table";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { showError, showConfirm } from "../toastr/Toaster";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
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
    } catch  {
      const was404 = ("404");
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
        showError(
          `No se pudieron recargar las líneas`
        );
      }
    }
  };

  const handleBtnAplicarEdit = async () => {
    await updateTipoAcom(objectTipoAcom.id, objectTipoAcom);
    await getListTipoAcom();
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
            <Text type="title" color="text-[#000]">
              {isOpenEdit
                ? "Editar Tipo de Orden de Acondicionamiento"
                : "Crear Nuevo Tipo de Acondicionamiento"}
            </Text>

            {/* Formulario principal */}
            <div className="mb-8">
              <Text type="subtitle" color="#000">
                Descripción
              </Text>
              <input
                id="descripcion"
                type="text"
                name="descripcion"
                value={objectTipoAcom.descripcion}
                onChange={inputChangeObjectTipoAcom}
                disabled={btnAplicar || !canEdit}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 text-center"
                placeholder="Ejemplo: Revisión técnica"
              />
            </div>

            {/* Tabla y formulario dinámico (solo si se aplicó el tipo base o estás editando) */}
            {(btnAplicar || isOpenEdit) && (
              <>
                <Text type="title" color="text-[#000]">
                  Líneas de Acondicionamiento
                </Text>
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-gray-700 text-center border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 border-r border-gray-200">
                          Orden
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 border-r border-gray-200">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 border-r border-gray-200">
                          Fase
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 border-r border-gray-200">
                          Actividades en Proceso
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 border-r border-gray-200">
                          Control
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 border-r border-gray-200">
                          Fase Control
                        </th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lineas.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                        >
                          <td className="px-4 py-3 border-r border-gray-200">
                            {item.orden}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {item.descripcion}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {item.descripcion_fase}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {item.editable ? "Sí" : "No"}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {item.control ? "Sí" : "No"}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {item.descripcion_fase_control || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteLinea(item.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar línea"
                              disabled={!canEdit}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Fila de formulario */}
                      <tr className="bg-white border-t border-gray-200">
                        <td className="px-4 py-3 border-r border-gray-200">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!canEdit}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <input
                            type="text"
                            name="descripcion"
                            placeholder="Descripción"
                            value={lineaForm.descripcion}
                            onChange={inputChangeObjectLineaTipoAcom}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!canEdit}
                          />
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                              {/* Mostrar solo última versión por descripción (agrupada) */}
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
                                .filter((item) => item.phase_type !== "Control") // excluir "Control" aquí
                                .sort((a, b) =>
                                  a.description.localeCompare(b.description)
                                )
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.description}
                                    {Number(item.version) > 1
                                      ? ` (v${item.version})`
                                      : ""}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
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
                              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
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
                              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">
                                  Seleccione una fase control
                                </option>
                                {listStagesControls
                                  .sort((a, b) =>
                                    a.description.localeCompare(b.description)
                                  )
                                  .map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.description}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        </td>
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
            <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
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
                  label={isOpenEdit ? "Actualizar" : "Aplicar"}
                />
              )}
            </div>
          </ModalSection>
        )}
      </div>
    </>
  );
}
