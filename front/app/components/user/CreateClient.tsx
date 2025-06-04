"use client";
import { useState, useEffect } from "react";
import { createClients, getClients, getClientsId, deleteClients, updateClients } from "../../services/userDash/clientServices";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Table from "../table/Table";
import Button from "../buttons/buttons";
import ModalSection from "../modal/ModalSection";
import Text from "../text/Text";
import {CreateClientProps} from "../../interfaces/CreateClientProps";

interface Clients {
  id: number;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  job_position?: string;
  responsible_person?: { name: string; email: string }[];
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
  const [responsiblePerson, setResponsiblePerson] = useState<{ name: string; email: string }[]>([]);
  const [newResponsibleName, setNewResponsibleName] = useState("");
  const [newResponsibleEmail, setNewResponsibleEmail] = useState("");

  useEffect(() => {
    if (canView) {
      fetchClients();
    }
  }, [canView]);

  const fetchClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      showError("No se pudieron cargar los clientes");
    }
  };

  const handleSave = async () => {
    if (!name || !code || !email || !phone || !jobPosition) {
      showError("Por favor completa todos los campos obligatorios");
      return;
    }
    try {
      const payload = { name, code, email, phone, job_position: jobPosition, responsible_person: responsiblePerson };

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
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const clientData = await getClientsId(id);
      setEditingClients(clientData);
      setName(clientData.name);
      setCode(clientData.code);
      setEmail(clientData.email || "");
      setPhone(clientData.phone || "");
      setJobPosition(clientData.job_position || "");
      setResponsiblePerson(clientData.responsible_person ? JSON.parse(clientData.responsible_person) : []);
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
        setClients((prevClients) => prevClients.filter((client) => client.id !== id));
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
          <Button onClick={() => setIsModalOpen(true)} variant="create" label="Crear Cliente" />
        </div>
      )}

      {isModalOpen && (
        <ModalSection isVisible={isModalOpen} onClose={closeModal}>
          <Text type="title">{editingClients ? "Editar Cliente" : "Crear Cliente"}</Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text type="subtitle">Nombre del Cliente</Text>
              <input
                type="text"
                placeholder="Nombre del Cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 rounded text-black"
                disabled={!canEdit}
              />
            </div>

            <div>
              <Text type="subtitle">Código</Text>
              <input
                type="text"
                placeholder="Código"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border p-2 rounded text-black"
                disabled={!canEdit}
              />
            </div>

            <div>
              <Text type="subtitle">Correo</Text>
              <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded text-black"
                disabled={!canEdit}
              />
            </div>

            <div>
              <Text type="subtitle">Teléfono</Text>
              <input
                type="number"
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border p-2 rounded text-black"
                disabled={!canEdit}
              />
            </div>

            <div className="col-span-2">
              <Text type="subtitle">Puesto de Trabajo</Text>
              <input
                type="text"
                placeholder="Puesto de trabajo"
                value={jobPosition}
                onChange={(e) => setJobPosition(e.target.value)}
                className="w-full border p-2 rounded text-black"
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Responsable */}
          <div className="mt-4">
            <Text type="subtitle">Responsable</Text>
            <div className="flex flex-wrap gap-2 mb-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <Text type="subtitle">Nombre</Text>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newResponsibleName}
                  onChange={(e) => setNewResponsibleName(e.target.value)}
                  className="w-full border p-2 rounded text-black"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Text type="subtitle">Correo</Text>
                <input
                  type="email"
                  placeholder="Correo"
                  value={newResponsibleEmail}
                  onChange={(e) => setNewResponsibleEmail(e.target.value)}
                  className="w-full border p-2 rounded text-black"
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <button
                  onClick={() => {
                    if (newResponsibleName && newResponsibleEmail) {
                      setResponsiblePerson([
                        ...responsiblePerson,
                        { name: newResponsibleName, email: newResponsibleEmail },
                      ]);
                      setNewResponsibleName("");
                      setNewResponsibleEmail("");
                    }
                  }}
                  className="bg-blue-500 text-white px-3 py-2 rounded h-[42px]"
                >
                  Agregar
                </button>
              )}
            </div>

            <ul>
              {Array.isArray(responsiblePerson) && responsiblePerson.length > 0 ? (
                responsiblePerson.map((person, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center bg-gray-100 p-2 rounded mb-1"
                  >
                    <p className="text-black">
                      <strong>{person.name}:</strong> {person.email}
                    </p>
                    {canEdit && (
                      <button
                        onClick={() =>
                          setResponsiblePerson(
                            responsiblePerson.filter((_, i) => i !== index)
                          )
                        }
                        className="text-red-500 text-xs"
                      >
                        Eliminar
                      </button>
                    )}
                  </li>
                ))
              ) : ("")}
            </ul>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={closeModal} variant="cancel" />
            {canEdit && <Button onClick={handleSave} variant="save" />}
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
