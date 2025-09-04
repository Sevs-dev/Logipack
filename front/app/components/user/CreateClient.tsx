"use client";
import { useState, useEffect, useCallback } from "react";
import {
  createClients,
  getClients,
  getClientsId,
  deleteClients,
  updateClients,
} from "../../services/userDash/clientServices";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Table from "../table/Table";
import Button from "../buttons/buttons";
import ModalSection from "../modal/ModalSection";
import Text from "../text/Text";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import DateLoader from "@/app/components/loader/DateLoader";
import { Input } from "../inputs/Input";

interface ResponsiblePerson {
  name: string;
  email: string;
}

interface RawClient {
  id: number;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  job_position?: string;
  responsible_person?: string | string[] | ResponsiblePerson[];
}

interface Clients {
  id: number;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  job_position?: string;
  responsible_person: ResponsiblePerson[];
}

function CreateClient({ canEdit = false, canView = false }: CreateClientProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [clients, setClients] = useState<Clients[]>([]);
  const [editingClients, setEditingClients] = useState<Clients | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState<
    { name: string; email: string }[]
  >([]);
  const [newResponsibleName, setNewResponsibleName] = useState("");
  const [newResponsibleEmail, setNewResponsibleEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const data: RawClient[] = await getClients();

      const mappedClients: Clients[] = data.map((client) => ({
        id: client.id,
        name: client.name,
        code: client.code,
        email: client.email,
        phone: client.phone,
        job_position: client.job_position,
        responsible_person: parseResponsiblePerson(client.responsible_person),
      }));

      setClients(mappedClients);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      showError("No se pudieron cargar los clientes");
    }
  }, []); // ← limpio, sin showError

  useEffect(() => {
    if (canView) {
      fetchClients();
    }
  }, [canView, fetchClients]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    if (!name || !code || !email || !phone || !jobPosition) {
      showError("Por favor completa todos los campos obligatorios");
      return;
    }
    try {
      const payload = {
        name,
        code,
        email,
        phone,
        job_position: jobPosition,
        responsible_person: responsiblePerson.map((person) =>
          JSON.stringify(person)
        ),
      };

      if (editingClients) {
        await updateClients(editingClients.id, payload);
        showSuccess("Cliente actualizado exitosamente");
      } else {
        await createClients(payload);
        showSuccess("Cliente creado exitosamente");
      }

      fetchClients();
      closeModal();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      showError("Error al guardar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const parseResponsiblePerson = (
    input?: string | string[] | ResponsiblePerson[]
  ): ResponsiblePerson[] => {
    if (!input) return [];

    if (Array.isArray(input)) {
      return input.map((person) =>
        typeof person === "string" ? JSON.parse(person) : person
      );
    }

    if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }

    return [];
  };

  const handleEdit = async (id: number) => {
    try {
      const clientData = await getClientsId(id);
      // Convert responsible_person from string[] to { name, email }[]
      const responsiblePersonArray = parseResponsiblePerson(
        clientData.responsible_person
      );

      setName(clientData.name);
      setCode(clientData.code);
      setEmail(clientData.email || "");
      setPhone(clientData.phone || "");
      setJobPosition(
        typeof clientData.job_position === "string"
          ? clientData.job_position
          : ""
      );
      setResponsiblePerson(responsiblePersonArray);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al obtener datos del cliente:", error);
      showError("No se pudo cargar el cliente para editar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;

    showConfirm("¿Estás seguro de eliminar este cliente?", async () => {
      try {
        await deleteClients(id);
        setClients((prevClients) =>
          prevClients.filter((client) => client.id !== id)
        );
        showSuccess("Cliente eliminado exitosamente");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        showError("Error al eliminar cliente");
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClients(null);
    setName("");
    setCode("");
    setEmail("");
    setPhone("");
    setJobPosition("");
    setResponsiblePerson([]);
  };

  if (!canView) {
    return <div>No tienes permiso para ver esta sección.</div>;
  }

  return (
    <div>
      {/* Solo muestra botón crear si puede editar */}
      {canEdit && (
        <div className="flex justify-center mb-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="create"
            label="Crear Cliente"
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

      {isModalOpen && (
        <ModalSection isVisible={isModalOpen} onClose={closeModal}>
          <div className="dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              {editingClients ? "Editar Cliente" : "Crear Cliente"}
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Nombre */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Nombre del Cliente
                </Text>
                <Input
                  type="text"
                  placeholder="Nombre del Cliente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Código */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Código
                </Text>
                <Input
                  type="text"
                  placeholder="Código"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!canEdit}
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Correo */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Correo
                </Text>
                <Input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!canEdit}
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Teléfono */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Teléfono
                </Text>
                <Input
                  type="number"
                  placeholder="Teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEdit}
                  tone="strong"
                  className="w-full text-center"
                />
              </div>

              {/* Puesto de trabajo */}
              <div className="col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Puesto de Trabajo
                </Text>
                <Input
                  type="text"
                  placeholder="Puesto de trabajo"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  disabled={!canEdit}
                  tone="strong"
                  className="w-full text-center"
                />
              </div>
            </div>

            {/* Responsable */}
            <div className="mt-6">
              <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                Responsable
              </Text>

              <div className="flex flex-wrap gap-2 mb-3 items-end">
                {/* Nombre */}
                <div className="flex-1 min-w-[220px]">
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Nombre
                  </Text>
                  <Input
                    type="text"
                    placeholder="Nombre"
                    value={newResponsibleName}
                    onChange={(e) => setNewResponsibleName(e.target.value)}
                    disabled={!canEdit}
                    tone="strong"
                    className="w-full text-center"
                  />
                </div>

                {/* Correo */}
                <div className="flex-1 min-w-[220px]">
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Correo
                  </Text>
                  <Input
                    type="email"
                    placeholder="correo@empresa.com"
                    value={newResponsibleEmail}
                    onChange={(e) => setNewResponsibleEmail(e.target.value)}
                    disabled={!canEdit}
                    tone="strong"
                    className="w-full text-center"
                  />
                </div>

                {/* Agregar */}
                {canEdit && (
                  <Button
                    onClick={() => {
                      if (newResponsibleName && newResponsibleEmail) {
                        setResponsiblePerson([
                          ...responsiblePerson,
                          {
                            name: newResponsibleName,
                            email: newResponsibleEmail,
                          },
                        ]);
                        setNewResponsibleName("");
                        setNewResponsibleEmail("");
                      }
                    }}
                    variant="save"
                    label="Agregar"
                  />
                )}
              </div>

              {/* Lista responsables (sin cambios) */}
              <ul className="space-y-2">
                {Array.isArray(responsiblePerson) &&
                responsiblePerson.length > 0
                  ? responsiblePerson.map((person, index) => (
                      <li
                        key={`${person.email}-${index}`}
                        className={[
                          "flex items-center justify-between rounded-lg px-3 py-2",
                          "bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]",
                          "border border-[rgb(var(--border))]",
                          "dark:bg-slate-800/70 dark:border-slate-700",
                        ].join(" ")}
                      >
                        <p className="truncate">
                          <span className="font-semibold">{person.name}:</span>{" "}
                          <span className="opacity-80">{person.email}</span>
                        </p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setResponsiblePerson(
                                responsiblePerson.filter((_, i) => i !== index)
                              )
                            }
                            className="text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-2 py-1 text-sm"
                            aria-label={`Eliminar responsable ${person.name}`}
                          >
                            Eliminar
                          </button>
                        )}
                      </li>
                    ))
                  : null}
              </ul>
            </div>

            <hr className="my-6 border-t border-[rgb(var(--border))]/60 w-full max-w-lg mx-auto opacity-60 dark:border-slate-700" />

            {/* Acciones (sin cambios) */}
            <div className="flex justify-center gap-4">
              <Button onClick={closeModal} variant="cancel" />
              {canEdit && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  label={
                    isSaving
                      ? "Guardando..."
                      : editingClients
                      ? "Actualizar"
                      : "Crear"
                  }
                  variant="save"
                />
              )}
            </div>
          </div>
        </ModalSection>
      )}

      <Table
        columns={["name", "code", "email", "phone"]}
        rows={clients}
        columnLabels={{
          name: "Nombre",
          code: "Código",
          email: "Correo",
          phone: "Teléfono",
        }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default CreateClient;
