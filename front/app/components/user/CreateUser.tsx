import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { post, getRole } from "../../services/authservices";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BiLock } from "react-icons/bi";

function CreateUser() {
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  interface Role {
    id: number;
    name: string;
  }
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await getRole(); 
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const generatePassword = () => {
    const length = 12;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let newPassword = "";
    for (let i = 0; i < length; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      await post({ name, email, password, role });
      alert("Usuario creado exitosamente");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creando usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
      >
        Crear Usuario
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 animate-fadeIn z-50">
            <h1 className="text-2xl font-semibold mb-4 text-center">Crear Usuario</h1>
            <form className="space-y-3">
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-black border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-black border border-gray-300 rounded p-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-2.5 text-gray-500"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="absolute right-2 top-2.5 bg-yellow-500 text-white p-1 rounded"
                >
                  <BiLock size={16} />
                </button>
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border p-2 mb-2 w-full text-black"
              >
                <option value="">Seleccionar rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name} className="text-black">
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={loading}
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  {loading ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateUser;
