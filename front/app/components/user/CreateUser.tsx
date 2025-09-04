"use client";
import { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BiLock } from "react-icons/bi";
import { InfoPopover } from "../buttons/InfoPopover";
import {
  post,
  updateUser,
  deleteUser,
  getUsers,
  getDate,
} from "../../services/userDash/authservices";
import { getRole } from "../../services/userDash/rolesServices";
import { getFactory } from "../../services/userDash/factoryServices";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Table from "../table/Table";
import { Factory, Role } from "@/app/interfaces/CreateUser";
import { User } from "@/app/interfaces/Auth";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import SelectorDual from "../SelectorDual/SelectorDual";
import DateLoader from "@/app/components/loader/DateLoader";
import { Input } from "../inputs/Input";

function CreateUser({ canEdit = false, canView = false }: CreateClientProps) {
  // Estados para formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signature_bpm, setSignatureBPM] = useState("");
  const [security_pass, setSecurityPASS] = useState("");
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
      setSignatureBPM(
        typeof userToEdit.signature_bpm === "string"
          ? userToEdit.signature_bpm
          : ""
      );
      setSecurityPASS("");
      setSelectedFactorys(
        Array.isArray(userToEdit.factory) ? userToEdit.factory : []
      );
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
    setSecurityPASS("");
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
    if (!name?.trim() || !email?.trim() || !role?.trim()) {
      showError("Nombre, correo y rol son obligatorios");
      return false;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError("El correo electrónico no es válido");
      return false;
    }

    // Validar contraseña sólo si es creación o si fue modificada al editar
    const mustValidatePassword = !userToEdit || !!password;
    if (mustValidatePassword) {
      // Reglas: 8+ chars, al menos 1 minúscula, 1 mayúscula, 1 dígito y 1 símbolo
      // Solo permite letras, números y estos símbolos comunes
      const STRONG_PASS =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/\-]{8,}$/;

      if (!STRONG_PASS.test(password)) {
        showError(
          "La contraseña debe tener mínimo 8 caracteres e incluir al menos: 1 mayúscula, 1 minúscula, 1 número y 1 símbolo."
        );
        return false;
      }
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
        security_pass,
        factory: selectedFactorys.map((f) => f.id),
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
      // Solo IDs para el backend
      const factoryValue =
        Array.isArray(selectedFactorys) && selectedFactorys.length > 0
          ? selectedFactorys.map((f) =>
              typeof f === "object" && "id" in f ? f.id : f
            )
          : null;

      await updateUser(userToEdit!.id, {
        name,
        email,
        password: password || undefined,
        password_confirmation: password || undefined,
        role,
        signature_bpm,
        security_pass,
        factory: factoryValue,
      });

      showSuccess("Usuario actualizado exitosamente");
      setIsModalOpen(false);
      resetForm();
      setUserToEdit(null);
    } catch (error) {
      showError("Error actualizando usuario");
      console.error("Error actualizando usuario:", error);
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
          // String que puede ser un array JSON o un número
          const parsed = JSON.parse(userFactory);
          if (Array.isArray(parsed)) {
            factoryParsed = parsed
              .map((f) =>
                typeof f === "object" && f !== null && "id" in f
                  ? Number(f.id)
                  : Number(f)
              )
              .filter((n) => !isNaN(n));
          } else if (
            typeof parsed === "object" &&
            parsed !== null &&
            "id" in parsed
          ) {
            factoryParsed = [Number(parsed.id)];
          } else {
            const singleNumber = Number(parsed);
            if (!isNaN(singleNumber)) factoryParsed = [singleNumber];
          }
        } else if (Array.isArray(userFactory)) {
          // Array de objetos, números o strings
          factoryParsed = userFactory
            .map((f) =>
              typeof f === "object" && f !== null && "id" in f
                ? Number(f.id)
                : Number(f)
            )
            .filter((n) => !isNaN(n));
        } else if (
          typeof userFactory === "object" &&
          userFactory !== null &&
          "id" in userFactory
        ) {
          // Un solo objeto fábrica
          factoryParsed = [Number(userFactory.id)];
        } else if (typeof userFactory === "number") {
          // Un solo número
          factoryParsed = [userFactory];
        }
      } catch (parseError) {
        console.error("Error al parsear fábricas:", parseError);
      }

      // Obtener los objetos completos de fábrica a partir de sus IDs
      const selectedFactoryObjects = factory.filter((f) =>
        factoryParsed.includes(f.id)
      );

      // Setear usuario a editar con factories como objetos completos
      setUserToEdit({
        ...userData,
        factory: selectedFactoryObjects,
      });

      setSelectedFactorys(selectedFactoryObjects);

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      showError("Error obteniendo datos del usuario");
    }
  };

  const agregarMaquina = (Factory: Factory) => {
    if (!selectedFactorys.find((m) => m.id === Factory.id)) {
      setSelectedFactorys([...selectedFactorys, Factory]);
    }
  };

  const removerMaquina = (id: number) => {
    setSelectedFactorys(selectedFactorys.filter((m) => m.id !== id));
  };

  return (
    <div>
      {/* Botón para abrir modal crear usuario (solo si no estamos editando) */}
      {canEdit && !userToEdit && (
        <div className="flex justify-center space-x-2 mb-2">
          <Button onClick={openModal} variant="create" label="Crear Usuario" />
        </div>
      )}

      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}
      {/* Modal crear/editar usuario */}
      {isModalOpen && (
        <ModalSection isVisible={isModalOpen || editForm} onClose={closeModal}>
          <div className="dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              {userToEdit ? "Editar Usuario" : "Crear Usuario"}
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Nombre */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Nombre de Usuario
                  <InfoPopover content="Nombre completo o identificador del usuario en el sistema." />
                </Text>
                <Input
                  type="text"
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  className="text-center"
                  tone="strong"
                />
              </div>

              {/* Email */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Correo Electrónico
                  <InfoPopover content="Correo principal para notificaciones y acceso al sistema." />
                </Text>
                <Input
                  type="email"
                  placeholder="email@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!canEdit}
                  className="text-center"
                  tone="strong"
                />
              </div>

              {/* Contraseña */}
              <div className="relative">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Contraseña
                  {userToEdit && (
                    <InfoPopover content="Para no cambiar la contraseña, deja este campo vacío." />
                  )}
                  <InfoPopover content="Debe incluir mayúsculas, minúsculas, números y símbolos." />
                </Text>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!canEdit}
                    className="text-center pr-24"
                    tone="strong"
                  />

                  {/* Toggle ver */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!canEdit}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className={[
                      "absolute top-1/2 -translate-y-1/2 right-12 p-2 rounded border transition",
                      "border-[rgb(var(--border))] text-[rgb(var(--foreground))] bg-[rgb(var(--surface))]",
                      "hover:bg-[rgb(var(--surface-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                      !canEdit ? "opacity-60 cursor-not-allowed" : "",
                      "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                    ].join(" ")}
                  >
                    {showPassword ? (
                      <FiEyeOff size={16} />
                    ) : (
                      <FiEye size={16} />
                    )}
                  </button>

                  {/* Generar */}
                  <button
                    type="button"
                    onClick={generatePassword}
                    disabled={!canEdit}
                    title="Generar contraseña"
                    className={[
                      "absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded border transition",
                      "border-[rgb(var(--border))] text-[rgb(var(--accent))] bg-[rgb(var(--surface))]",
                      "hover:bg-[rgb(var(--accent))]/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                      !canEdit ? "opacity-60 cursor-not-allowed" : "",
                      "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                    ].join(" ")}
                  >
                    <BiLock size={16} />
                  </button>
                </div>

                {/* Medidor simple de fuerza */}
                <div className="mt-2 h-1.5 rounded bg-[rgb(var(--border))]/50">
                  <div
                    className={[
                      "h-full rounded transition-all",
                      (password?.length || 0) < 6
                        ? "bg-red-500"
                        : (password?.length || 0) < 10
                        ? "bg-yellow-500"
                        : "bg-green-500",
                    ].join(" ")}
                    style={{
                      width: `${Math.min(100, (password?.length || 0) * 8)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Contraseña de seguridad */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Contraseña de Seguridad
                  <InfoPopover content="Dependiendo del rol (p. ej., Calidad), se pedirá al firmar para validar la identidad." />
                </Text>
                <Input
                  type="text"
                  placeholder="Requerido según el Rol"
                  value={security_pass}
                  onChange={(e) => setSecurityPASS(e.target.value)}
                  disabled={!canEdit}
                  className="text-center"
                  tone="strong"
                />
              </div>

              {/* Rol (select se deja igual) */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Rol
                  <InfoPopover content="Define los permisos y accesos que tendrá este usuario." />
                </Text>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={!canEdit}
                  className={[
                    "w-full p-2 text-center rounded border transition",
                    "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]",
                    "border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                    !canEdit ? "opacity-60 cursor-not-allowed" : "",
                    "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                  ].join(" ")}
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((r) => (
                    <option
                      key={r.id}
                      value={r.name}
                      className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                    >
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Firma BPM */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Firma BPM
                  <InfoPopover content="Firma utilizada en procesos BPM para validar acciones." />
                </Text>
                <Input
                  type="text"
                  placeholder="Firma BPM"
                  value={signature_bpm}
                  onChange={(e) => setSignatureBPM(e.target.value)}
                  disabled={!canEdit}
                  className="text-center"
                  tone="strong"
                />
              </div>

              {/* Fábricas (SelectorDual se deja igual) */}
              <div className="col-span-1 md:col-span-2">
                <SelectorDual
                  titulo="Fábricas asignadas"
                  disponibles={factory}
                  seleccionados={selectedFactorys}
                  onAgregar={agregarMaquina}
                  onQuitar={removerMaquina}
                />
              </div>
            </div>

            {/* Botones */}
            <hr className="my-4 border-t border-[rgb(var(--border))]/60 w-full max-w-lg mx-auto opacity-60 dark:border-slate-700" />
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={closeModal} variant="cancel" label="Cancelar" />
              {canEdit && (
                <Button
                  onClick={userToEdit ? handleEditUser : handleCreateUser}
                  variant="save"
                  label={
                    loading
                      ? "Guardando..."
                      : userToEdit
                      ? "Guardar cambios"
                      : isSaving
                      ? "Guardando..."
                      : "Crear usuario"
                  }
                  disabled={loading || isSaving}
                />
              )}
            </div>
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
          role: "Rol",
        }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default CreateUser;
