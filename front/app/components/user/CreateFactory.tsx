"use client";
import { useState, useEffect } from "react";
import {
  createFactory,
  getFactory,
  deleteFactory,
  getFactoryId,
  updateFactory,
} from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import { Factory } from "../../interfaces/NewFactory";
import ModalSection from "../modal/ModalSection";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import { getAuditsByModelAdmin } from "../../services/history/historyAuditServices";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import DateLoader from "@/app/components/loader/DateLoader";
import { InfoPopover } from "../buttons/InfoPopover";
import { Input } from "../inputs/Input";
import { Toggle } from "../inputs/Toggle";

function CreateFactory({
  canEdit = false,
  canView = false,
}: CreateClientProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [prefix, setPrefix] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [manager, setManager] = useState<string>("");
  const [employees, setEmployees] = useState<string>("");
  const [status, setStatus] = useState<boolean>(false);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  // Estado para la lista de auditorías
  const [auditList, setAuditList] = useState<Audit[]>([]);
  // Estado para la auditoría seleccionada (no se usa, pero se deja para posible ampliación)
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFactories = async () => {
    try {
      const data: Factory[] = await getFactory();
      setFactories(data);
    } catch {
      console.error("Error fetching factories:");
    }
  };

  useEffect(() => {
    if (canView) {
      fetchFactories();
    }
  }, [canView]);

  const resetForm = () => {
    setName("");
    setPrefix("");
    setLocation("");
    setCapacity("");
    setManager("");
    setEmployees("");
    setStatus(false);
    setEditingFactory(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    if (!name || !location || !capacity || !manager || !employees) {
      showError("Por favor, completa todos los campos antes de continuar.");
      return;
    }
    const factoryData = {
      name,
      location,
      capacity,
      manager,
      employees,
      status,
      prefix,
    };
    try {
      if (editingFactory) {
        await updateFactory(editingFactory.id, factoryData);
        showSuccess("Planta actualizada exitosamente");
      } else {
        await createFactory(factoryData);
        showSuccess("Planta creada exitosamente");
      }
      fetchFactories();
      setIsModalOpen(false);
      resetForm();
    } catch {
      showError("Error al guardar la planta");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    showConfirm("¿Seguro que quieres eliminar esta planta?", async () => {
      try {
        await deleteFactory(id);
        setFactories((prevFactories) =>
          prevFactories.filter((factory) => factory.id !== id)
        );
        showSuccess("Planta eliminada con éxito");
      } catch {
        showError("Error al eliminar la planta");
      }
    });
  };

  const handleEdit = async (id: number) => {
    try {
      const factoryData = await getFactoryId(id);
      setEditingFactory(factoryData);
      setName(factoryData.name);
      setPrefix(factoryData.prefix);
      setLocation(factoryData.location);
      setCapacity(factoryData.capacity);
      setManager(factoryData.manager);
      setEmployees(factoryData.employees);
      setStatus(factoryData.status);
      setIsModalOpen(true);
    } catch {
      showError("Error obteniendo datos de la planta");
    }
  };
  /**
   * Maneja la visualización del historial de auditoría de un producto.
   * @param id ID del producto
   */
  const handleHistory = async (id: number) => {
    const model = "Factory";
    try {
      const data = await getAuditsByModelAdmin(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch {
      console.error("Error al obtener la auditoría:");
    }
  };
  return (
    <div>
      <div className="flex justify-center mb-2">
        {canEdit && (
          <Button
            onClick={() => {
              setIsModalOpen(true);
              resetForm();
            }}
            variant="create"
            label="Crear Planta"
          />
        )}
      </div>

      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {isModalOpen && (
        <ModalSection
          isVisible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
            <div className="text-center">
              <Text type="title" color="text-[rgb(var(--foreground))]">
                {editingFactory ? "Editar" : "Crear"} Planta
              </Text>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center mt-4">
              {/* Nombre */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Nombre
                </Text>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Nombre de la planta"
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Prefijo */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Prefijo
                </Text>
                <Input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Ej. PLT-01"
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Ubicación */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Ubicación
                </Text>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Ciudad / Dirección"
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Capacidad */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Capacidad de producción
                  <InfoPopover
                    content={
                      <>
                        <p>Define cuánto puedes producir en un periodo.</p>
                        <ul className="list-disc pl-4 mt-1">
                          <li>
                            <strong>Unidad:</strong> unidades/hora (o la que
                            uses).
                          </li>
                          <li>
                            <strong>Cálculo sugerido:</strong> velocidad × horas
                            útiles × eficiencia (%).
                          </li>
                          <li>
                            Puedes escribirlo manualmente si quieres fijarlo.
                          </li>
                        </ul>
                        <p className="mt-1 text-xs text-gray-500">
                          Ej.: 1.200 u/h con 80% eficiencia → 960 u/h.
                        </p>
                      </>
                    }
                  />
                </Text>
                <Input
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Ej. 960 u/h"
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Responsable */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Responsable de producción
                  <InfoPopover
                    content={<p>Persona que lidera la producción.</p>}
                  />
                </Text>
                <Input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Nombre del responsable"
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Empleados */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Cantidad de empleados a cargo
                  <InfoPopover
                    content={
                      <>
                        <p>Número de personas asignadas a esta orden/turno.</p>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Solo enteros (sin decimales).</li>
                        </ul>
                      </>
                    }
                  />
                </Text>
                <Input
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={0}
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Ej. 12"
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Estado (Toggle) */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Estado
                </Text>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <Toggle
                    checked={status}
                    onCheckedChange={setStatus}
                    disabled={!canEdit}
                  />
                  <span className="text-sm text-[rgb(var(--foreground))]/70">
                    {status ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            <hr className="my-4 border-t border-[rgb(var(--border))]/60 w-full max-w-lg mx-auto opacity-60 dark:border-slate-700" />

            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={() => setIsModalOpen(false)} variant="cancel" />
              {canEdit && (
                <Button
                  onClick={handleSave}
                  variant="save"
                  disabled={isSaving}
                  label={
                    editingFactory
                      ? "Actualizar"
                      : isSaving
                      ? "Guardando..."
                      : "Guardar"
                  }
                />
              )}
            </div>
          </div>
        </ModalSection>
      )}
      <Table
        columns={["name", "prefix", "location", "manager", "status"]}
        rows={factories}
        columnLabels={{
          name: "Nombre de Planta",
          prefix: "Prefijo",
          location: "Ubicación",
          manager: "Persona a Cargo",
          status: "Estado",
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

export default CreateFactory;
