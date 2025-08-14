import { useState, useEffect } from "react";
import {
  getRole,
  getRoleId,
  createRole,
  updateRole,
  deleteRole,
} from "../../services/userDash/rolesServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import ModalSection from "../modal/ModalSection";
import Text from "../text/Text";
import { getAuditsByModelAdmin } from "../../services/history/historyAuditServices";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import { Role } from "../../interfaces/Role";
import DateLoader from "@/app/components/loader/DateLoader";

interface RolesProps {
  canEdit?: boolean; // permisos del usuario logueado para usar esta vista
  canView?: boolean;
}

// Tipo de respuesta del backend (snake_case)
type BackendRole = {
  id: number;
  name: string;
  can_edit?: boolean;
  can_view?: boolean;
  // agrega aquí lo que devuelva tu API si hace falta
};

// Normalizador: backend -> front (camelCase)
const toRole = (r: BackendRole | Role): Role => ({
  id: r.id,
  name: r.name,
  canEdit: "canEdit" in r ? r.canEdit : Boolean((r as BackendRole).can_edit),
  canView: "canView" in r ? r.canView : Boolean((r as BackendRole).can_view),
});

// Payload: front (camelCase) -> backend (snake_case)
const toBackendPayload = (p: { name: string; canEdit: boolean; canView: boolean }) => ({
  name: p.name,
  can_edit: p.canEdit,
  can_view: p.canView,
});

function Roles({ canEdit = false, canView = false }: RolesProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [roleCanEdit, setRoleCanEdit] = useState<boolean>(false);
  const [roleCanView, setRoleCanView] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [auditList, setAuditList] = useState<Audit[]>([]);
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (canView) fetchRoles();
  }, [canView]);

  const fetchRoles = async () => {
    try {
      const data: BackendRole[] = await getRole();
      setRoles(data.map(toRole));
    } catch (err) {
      console.error("Error al obtener los roles:", err);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setName("");
    setRoleCanEdit(false);
    setRoleCanView(false);
    setError("");
    setShowModal(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const data: BackendRole = await getRoleId(id);
      const r = toRole(data);
      setEditingRole(r);
      setName(r.name ?? "");
      setRoleCanEdit(Boolean(r.canEdit));
      setRoleCanView(Boolean(r.canView));
      setError("");
      setShowModal(true);
    } catch (err) {
      console.error("Error al obtener el rol:", err);
      showError("No se pudo obtener el rol");
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isSaving) return;
    setIsSaving(true);
    e.preventDefault();

    if (!name.trim()) {
      showError("El nombre es requerido");
      setIsSaving(false);
      return;
    }

    try {
      const payload = toBackendPayload({
        name,
        canEdit: roleCanEdit,
        canView: roleCanView,
      });
      const created: BackendRole = await createRole(payload);
      if (!created || !("id" in created)) throw new Error("Error al crear rol");
      await fetchRoles();
      showSuccess("Rol creado correctamente");
      setShowModal(false);
      setName("");
      setRoleCanEdit(false);
      setRoleCanView(false);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al crear el rol");
      showError("Ocurrió un error al crear el rol");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isSaving) return;
    setIsSaving(true);
    e.preventDefault();

    if (!name.trim() || !editingRole) {
      setError("El nombre es requerido");
      setIsSaving(false);
      return;
    }

    try {
      const payload = toBackendPayload({
        name,
        canEdit: roleCanEdit,
        canView: roleCanView,
      });
      const updated: BackendRole | Role = await updateRole(editingRole.id, payload);

      // Actualiza estado local
      const next = toRole(updated);
      setRoles((prev) =>
        prev.map((r) => (r.id === editingRole.id ? { ...r, ...next } : r))
      );

      // Si tu backend versiona y devuelve un nuevo ID, recarga
      if (next.id !== editingRole.id) {
        await fetchRoles();
      }

      showSuccess("Rol actualizado correctamente");
      setShowModal(false);
      setName("");
      setRoleCanEdit(false);
      setRoleCanView(false);
      setError("");
      setEditingRole(null);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el rol");
      showError("Ocurrió un error al actualizar el rol");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      showConfirm("¿Estás seguro de eliminar este rol?", async () => {
        await deleteRole(id);
        setRoles((prev) => prev.filter((r) => r.id !== id));
        showSuccess("Rol eliminado correctamente");
      });
    } catch (err) {
      console.error("Error al eliminar el rol", err);
      showError("No se pudo eliminar el rol");
    }
  };

  const handleHistory = async (id: number) => {
    const model = "Roles";
    try {
      const data = await getAuditsByModelAdmin(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (error) {
      console.error("Error al obtener auditoría:", error);
    }
  };

  return (
    <div>
      {canEdit && (
        <div className="flex justify-center mb-2">
          <Button onClick={openCreateModal} variant="create" label="Crear Rol" />
        </div>
      )}

      {isSaving && (
        <DateLoader
          message="Guardando..."
          backgroundColor="rgba(0,0,0,0.25)"
          color="#fff700"
        />
      )}

      {showModal && (
        <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
          <Text type="title" color="text-[#000]">
            {editingRole ? "Editar Rol" : "Crear Rol"}
          </Text>

          <form onSubmit={editingRole ? handleUpdate : handleCreate} className="space-y-6">
            {/* Nombre del rol */}
            <div className="space-y-2">
              <Text type="subtitle" color="#000">Nombre del rol</Text>
              <div className={`relative`}>
                {/* Icono a la izquierda (usa lucide-react si ya lo tienes) */}
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-4 0-8 2-8 6v1h16v-1c0-4-4-6-8-6Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Ej. Administrador"
                  className={[
                    "w-full pl-10 pr-3 py-2 rounded-xl border bg-white text-black text-center",
                    "placeholder-gray-400/90",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400",
                    "transition-shadow",
                    canEdit ? "border-gray-300 hover:shadow-sm" : "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  ].join(" ")}
                  aria-invalid={!!error}
                  aria-describedby={error ? "role-error" : undefined}
                />
              </div> 
            </div>

            {/* Permisos: toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Toggle canEdit */}
              <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18.71-11.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66Z" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Puede editar</span>
                    <span className="text-xs text-gray-500">Crear/actualizar contenido</span>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={roleCanEdit}
                  onClick={() => canEdit && setRoleCanEdit(v => !v)}
                  disabled={!canEdit}
                  className={[
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    roleCanEdit ? "bg-indigo-600" : "bg-gray-300",
                    !canEdit && "opacity-60 cursor-not-allowed"
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                      roleCanEdit ? "translate-x-5" : "translate-x-1"
                    ].join(" ")}
                  />
                </button>
              </label>

              {/* Toggle canView */}
              <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Puede ver</span>
                    <span className="text-xs text-gray-500">Acceso de solo lectura</span>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={roleCanView}
                  onClick={() => canEdit && setRoleCanView(v => !v)}
                  disabled={!canEdit}
                  className={[
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    roleCanView ? "bg-emerald-600" : "bg-gray-300",
                    !canEdit && "opacity-60 cursor-not-allowed"
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                      roleCanView ? "translate-x-5" : "translate-x-1"
                    ].join(" ")}
                  />
                </button>
              </label>
            </div>

            {/* Error */}
            {error && (
              <p id="role-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                {error}
              </p>
            )}

            {/* Footer acciones */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="cancel" />
              {canEdit && (
                <Button
                  type="submit"
                  variant="save"
                  label={isSaving ? "Guardando..." : (editingRole ? "Actualizar" : "Crear")}
                  disabled={isSaving}
                />
              )}
            </div>
          </form>
        </ModalSection>
      )}

      <Table<Role>
        columns={["name", "canEdit", "canView"]}
        rows={roles}
        columnLabels={{ name: "Nombre", canEdit: "Puede Editar", canView: "Puede Ver" }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={openEditModal}
        onHistory={handleHistory}
      />

      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default Roles;
