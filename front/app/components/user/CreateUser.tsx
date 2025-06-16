"use client";
import { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BiLock } from "react-icons/bi";
import { InfoPopover } from "../buttons/InfoPopover";
import { post, updateUser, getRole, deleteUser, getUsers, getDate } from "../../services/userDash/authservices";
import { getFactory } from "../../services/userDash/factoryServices";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Table from "../table/Table";
import { Factory, Role } from "@/app/interfaces/CreateUser";
import { User } from "@/app/interfaces/Auth";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import SelectorDual from "../SelectorDual/SelectorDual"

function CreateUser({ canEdit = false, canView = false }: CreateClientProps) {
  // Estados para formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signature_bpm, setSignatureBPM] = useState("");
  const [role, setRole] = useState("");
  // Otros estados
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedFactorys, setSelectedFactorys] = useState<Factory[]>([]);
  const [factory, setfactory] = useState<Factory[]>([]);
  // Datos de API
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editForm] = useState({
    name: "",
    email: "",
    role: "", // guardamos el id del rol como string
    factory: [] as number[],
  });
  const [isSaving, setIsSaving] = useState(false);
  // Carga inicial de roles, fábricas y usuarios
  useEffect(() => {
    if (!canView) return;
    async function fetchInitialData() {
      try {
        const [rolesData, factoryData, usersData] = await Promise.all([
          getRole(),
          getFactory(),
          getUsers(),
        ]);
        setRoles(rolesData);
        setfactory(factoryData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    }
    fetchInitialData();
  }, [canView]);

  // Cargar datos en el formulario si editamos
  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setSignatureBPM(typeof userToEdit.signature_bpm === "string" ? userToEdit.signature_bpm : "");
      setSelectedFactorys(Array.isArray(userToEdit.factory) ? userToEdit.factory : []);
      setPassword("");
      setIsModalOpen(true);
    }
  }, [userToEdit]);

  // Reset form fields
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setSignatureBPM("");
    setSelectedFactorys([]);
    setRole("");
    setShowPassword(false);
  };

  // Generar contraseña aleatoria
  const generatePassword = () => {
    const length = 12;
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let newPassword = "";
    for (let i = 0; i < length; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
  };

  // Validar campos antes de crear o editar
  const validateFields = () => {
    if (!name || !email || !role) {
      showError("Nombre, correo y rol son obligatorios");
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError("El correo electrónico no es válido");
      return false;
    }
    // Validar contraseña solo si es creación o si se modificó la contraseña al editar
    if ((!userToEdit || password) && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{8,}$/.test(password)) {
      showError(
        "La contraseña debe tener al menos 8 caracteres, incluir letras y números, y puede contener caracteres especiales"
      );
      return false;
    }
    return true;
  };

  // Crear usuario nuevo
  const handleCreateUser = async () => {
    if (isSaving) return;
    if (!validateFields()) return;
    setIsSaving(true);
    setLoading(true);
    try {
      await post({
        name,
        email,
        password,
        role,
        signature_bpm,
        factory: selectedFactorys.map(f => f.id),
      });
      showSuccess("Usuario creado exitosamente");
      const newUsers = await getUsers();
      setUsers(newUsers);
      setIsModalOpen(false);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creando usuario:", error);
      showError("Error creando usuario");
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Editar usuario existente
  const handleEditUser = async () => {
    if (isSaving) return;
    if (!validateFields()) return;
    setIsSaving(true);
    setLoading(true);
    try {
      await updateUser(userToEdit!.id, {
        name,
        email,
        password: password || undefined,
        role,
        signature_bpm,
        factory: selectedFactorys,
      });
      showSuccess("Usuario actualizado exitosamente");
      setIsModalOpen(false);
      resetForm();
      setUserToEdit(null); // Limpiar usuario editado 
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      showError("Error actualizando usuario");
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Abrir modal de creación
  const openModal = () => {
    resetForm();
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Eliminar usuario con confirmación
  const handleDelete = async (id: number) => {
    if (!canEdit) return; // Verificar permisos antes de eliminar
    showConfirm("¿Seguro que quieres eliminar este usuario?", async () => {
      try {
        await deleteUser(id);
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        showSuccess("Usuario eliminado con éxito");
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        showError("Error al eliminar usuario");
      }
    });
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await getDate(id);
      const userData: User = response.usuario;

      let factoryParsed: number[] = [];

      try {
        const { factory: userFactory } = userData;
        if (typeof userFactory === "string") {
          const parsed = JSON.parse(userFactory);
          if (Array.isArray(parsed)) {
            factoryParsed = parsed.map(Number).filter(n => !isNaN(n));
          } else {
            const singleNumber = Number(parsed);
            if (!isNaN(singleNumber)) factoryParsed = [singleNumber];
          }
        } else if (Array.isArray(userFactory)) {
          factoryParsed = userFactory.map(Number).filter(n => !isNaN(n));
        } else if (typeof userFactory === "number") {
          factoryParsed = [userFactory];
        }
      } catch (parseError) {
        console.error("Error al parsear fábricas:", parseError);
      }

      // Obtener los objetos completos de fábrica a partir de sus IDs
      const selectedFactoryObjects = factory.filter(f => factoryParsed.includes(f.id));

      // Setear usuario a editar con factories como objetos completos
      setUserToEdit({
        ...userData,
        factory: selectedFactoryObjects, // <-- aquí el cambio
      });

      setSelectedFactorys(selectedFactoryObjects);

      setIsModalOpen(true);

    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      showError("Error obteniendo datos del usuario");
    }
  };

  const agregarMaquina = (Factory: Factory) => {
    if (!selectedFactorys.find(m => m.id === Factory.id)) {
      setSelectedFactorys([...selectedFactorys, Factory]);
    }
  };

  const removerMaquina = (id: number) => {
    setSelectedFactorys(selectedFactorys.filter(m => m.id !== id));
  };

  return (
    <div>
      {/* Botón para abrir modal crear usuario (solo si no estamos editando) */}
      {canEdit && !userToEdit && (
        <div className="flex justify-center space-x-2 mb-2">
          <Button onClick={openModal} variant="create" label="Crear Usuario" />
        </div>
      )}
      {/* Modal crear/editar usuario */}
      {isModalOpen && (
        <ModalSection isVisible={isModalOpen || editForm} onClose={closeModal}>
          <Text type="title" color="text-[#000]">{userToEdit ? "Editar Usuario" : "Crear Usuario"}</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Nombre */}
            <div>
              <Text type="subtitle" color="text-[#000]">Nombre de Usuario</Text>
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>

            {/* Email */}
            <div>
              <Text type="subtitle" color="text-[#000]">Correo Electrónico</Text>
              <input
                type="email"
                placeholder="email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>

            {/* Contraseña */}
            <div className="relative">
              <Text type="subtitle" color="text-[#000]">
                Contraseña
                {userToEdit && <InfoPopover content="Para no cambiar la contraseña dejar el campo en blanco" />}
              </Text>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-10 top-12 text-gray-500"
                disabled={!canEdit}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="absolute right-2 top-12 bg-yellow-500 text-white p-1 rounded"
                disabled={!canEdit}
              >
                <BiLock size={16} />
              </button>
            </div>

            {/* Rol */}
            <div>
              <Text type="subtitle" color="text-[#000]">Rol</Text>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              >
                <option value="">Selecciona un rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Firma BPM */}
            <div>
              <Text type="subtitle" color="text-[#000]">Firma BPM</Text>
              <input
                type="text"
                placeholder="Firma BPM"
                value={signature_bpm}
                onChange={(e) => setSignatureBPM(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>

            {/* Fábricas */}
            <div className="col-span-1 md:col-span-2">
              <Text type="subtitle" color="text-[#000]">Fábricas asignadas</Text>
              <SelectorDual
                titulo="Maquinaria"
                disponibles={factory}
                seleccionados={selectedFactorys}
                onAgregar={agregarMaquina}
                onQuitar={removerMaquina}
              />
            </div>

          </div>

          {/* Botones */}
          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={closeModal} variant="cancel" label="Cancelar" />
            {canEdit && (
              <Button
                onClick={userToEdit ? handleEditUser : handleCreateUser}
                variant="save"
                label={loading ? "Guardando..." : userToEdit ? "Guardar cambios" : isSaving ? "Guardando..." : "Crear usuario"}
                disabled={loading || isSaving}
              />
            )}
          </div>
        </ModalSection>
      )}

      {/* Tabla de usuarios */}
      <Table
        columns={["name", "email", "role"]}
        rows={users}
        columnLabels={{
          name: "Nombre",
          email: "Email",
          role: "Rol"
        }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={handleEdit}
      />

    </div>
  );
}

export default CreateUser;
