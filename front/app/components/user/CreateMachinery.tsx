"use client";
import React, { useState, useEffect, useCallback } from "react";
// 🔹 Servicios
import * as machineryService from "../../services/userDash/machineryServices";
import { getFactory } from "../../services/userDash/factoryServices";
import { getAuditsByModelAdmin } from "../../services/history/historyAuditServices";
// 🔹 Componentes
import Button from "../buttons/buttons";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Table from "../table/Table";
import Text from "../text/Text";
import { InfoPopover } from "../buttons/InfoPopover";
import ModalSection from "../modal/ModalSection";
import AuditModal from "../history/AuditModal";
// 🔹 Tipos de datos
import { Factory } from "../../interfaces/NewFactory";
import { MachineryForm, Machine } from "../../interfaces/NewMachine";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import { Audit } from "../../interfaces/Audit";

function CreateMachinery({ canEdit = false, canView = false }: CreateClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [machine, setMachine] = useState<Machine[]>([]);
  const [factory, setFactory] = useState<Factory[]>([]);

  const [name, setName] = useState("");
  const [factory_id, setFactoryId] = useState<number | string>("");
  const [editMachineryId, setEditMachineryId] = useState<number | null>(null);
  const [category, setCategory] = useState("mediana");
  const [type, setType] = useState("");
  const [power, setPower] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [dimensions, setDimensions] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [is_mobile, setIsMobile] = useState(false);
  const [description, setDescription] = useState("");
  // Estado para la lista de auditorías
  const [auditList, setAuditList] = useState<Audit[]>([]);
  // Estado para la auditoría seleccionada (no se usa, pero se deja para posible ampliación)
  const [, setSelectedAudit] = useState<Audit | null>(null);
  useEffect(() => {
    if (canView) {
      const fetchData = async () => {
        try {
          const [machines, factories] = await Promise.all([
            machineryService.getMachin(),
            getFactory(),
          ]);
          setMachine(machines);
          setFactory(factories);
        } catch (error) {
          console.error("Error inicializando datos:", error);
        }
      };
      fetchData();
    }
  }, [canView]);

  const fetchMachine = useCallback(async () => {
    try {
      const data = await machineryService.getMachin();
      setMachine(data);
    } catch (error) {
      console.error("Error fetching maquinarias:", error);
    }
  }, []);

  const resetForm = () => {
    setIsEditMode(false);
    setName("");
    setFactoryId("");
    setCategory("");
    setType("");
    setPower("");
    setCapacity("");
    setDimensions("");
    setWeight("");
    setIsMobile(false);
    setDescription("");
    setEditMachineryId(null);
  };

  const handleSubmit = async () => {
    try {
      const data: MachineryForm = {
        factory_id: Number(factory_id),
        name,
        category,
        type,
        power: String(power),
        capacity: String(capacity),
        dimensions,
        weight: String(weight),
        is_mobile,
        description,
      };

      if (isEditMode) {
        await machineryService.updateMachin(editMachineryId!, data);
        showSuccess("Maquinaria actualizada exitosamente");
      } else {
        await machineryService.newMachin(data);
        showSuccess("Maquinaria creada exitosamente");
      }

      resetForm();
      setIsOpen(false);
      fetchMachine();
    } catch (error) {
      console.error("Error al guardar maquinaria:", error);
      showError("Error al guardar maquinaria");
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data = await machineryService.getMachinById(id);
      // console.log("Data to edit:", data);
      setEditMachineryId(id);
      setIsEditMode(true);
      setIsOpen(true);
      setName(data.name);
      setFactoryId(data.factory_id);
      setCategory(data.category);
      setType(data.type);
      setPower(data.power);
      setCapacity(data.capacity);
      setDimensions(data.dimensions);
      setWeight(data.weight);
      setIsMobile(data.is_mobile);
      setDescription(data.description);
    } catch (error) {
      console.error("Error al obtener detalles de la maquinaria:", error);
      showError("Error al cargar los datos de la maquinaria");
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    showConfirm("¿Estás seguro de eliminar esta Maquinaria?", async () => {
      try {
        await machineryService.deleteMachin(id);
        setMachine((prev) => prev.filter((m) => m.id !== id));
        showSuccess("Maquinaria eliminada exitosamente");
        fetchMachine();
      } catch (error) {
        console.error("Error al eliminar Maquinaria:", error);
        showError("Error al eliminar Maquinaria");
      }
    });
  };

  const handleHistory = async (id: number) => {
    const model = "Machinery";
    try {
      const data = await getAuditsByModelAdmin(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (error) {
      console.error("Error al obtener la auditoría:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-center space-x-2 mb-2">
        {canEdit && (
          <Button onClick={() => { resetForm(); setIsOpen(true); }} variant="create" label="Crear Maquinaria" />
        )}
      </div>

      {isOpen && (
        <ModalSection isVisible={isOpen} onClose={() => { setIsOpen(false) }}>
          <Text type="title">{isEditMode ? "Editar" : "Crear"} Maquinaria</Text>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna 1 */}
            <div className="space-y-4">
              <div>
                <Text type="subtitle">Nombre</Text>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Text type="subtitle">Categoría</Text>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="Grande">Grande</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Pequeña">Pequeña</option>
                </select>
              </div>

              <div>
                <Text type="subtitle">Potencia</Text>
                <input
                  type="number"
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Text type="subtitle">Dimensiones</Text>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Text type="subtitle">Descripción</Text>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                  rows={4}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <div>
                <Text type="subtitle">Plantas</Text>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  value={factory_id}
                  onChange={(e) => setFactoryId(e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">Seleccionar Planta</option>
                  {factory.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Text type="subtitle">Tipo</Text>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Text type="subtitle">Capacidad
                  <InfoPopover content="La capidad que la maquina puede producir por dia" />
                </Text>
                <input
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Text type="subtitle">Peso</Text>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black text-center"
                  disabled={!canEdit}
                />
              </div>

              <div className="flex flex-col items-center">
                <Text type="subtitle">Movíl</Text>
                <input
                  type="checkbox"
                  checked={is_mobile}
                  onChange={(e) => setIsMobile(e.target.checked)}
                  className="h-5 w-5 text-blue-600 mt-2"
                  disabled={!canEdit}
                />
              </div>

            </div>
          </form>

          <div className="flex justify-end space-x-4 mt-4">
            <Button
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              variant="cancel"
              label="Cancelar"
            />
            {canEdit && (
              <Button onClick={handleSubmit} variant="save" label="Guardar" />
            )}
          </div>
        </ModalSection>
      )}

      <Table
        columns={["name", "category", "type", "power"]}
        rows={machine}
        columnLabels={{
          name: "Nombre",
          category: "Categoría",
          type: "Tipo",
          power: "Potencia",
        }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={handleEdit} 
        onHistory={handleHistory}
      />

      {/* Modal de auditoría */}
      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default CreateMachinery;
