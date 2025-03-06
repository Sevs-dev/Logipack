"use client";
import React, { useState, useEffect } from "react";
import { getUsers, deleteUser, getDate, updateUser, getRole } from '../../services/userDash/authservices';
import { getFactory } from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import CreateUser from "./CreateUser"; // Importa el componente CreateUser
import { useAuth } from '../../hooks/useAuth'
import { getUserByEmail } from '../../services/userDash/authservices';
import nookies from "nookies";

interface Role {
    id: number;
    name: string;
    permissions: { id: number; name: string }[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role: Role[];
    factory?: number;
}

interface Factory {
    id: number;
    name: string;
}

function DataUsers() {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        role: "",
        factory: [] as number[],
    });
    const [users, setUsers] = useState<{ [key: string]: any }[]>([]);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const columns = ["name", "email", "role"];
    const columnLabels: { [key: string]: string } = {
        name: "Nombre",
        email: "Email",
        role: "Rol",
    };

    // Función para obtener la lista de usuarios
    const fetchUsers = async () => {
        try {
            const data: User[] = await getUsers();
            setUsers(data.map(user => ({
                ...user,
                role: user.role ? user.role : "Sin rol",
                factory: user.factory || "Sin fábrica"
            })));
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers(); // Llama a fetchUsers al montar el componente
        const fetchFactories = async () => {
            try {
                const data = await getFactory();
                setFactories(data);
            } catch (error) {
                console.error("Error fetching factories:", error);
            }
        };
        fetchFactories();
    }, []);

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

       //UseEffect para actualizacion del token
   const { isAuthenticated } = useAuth();
   const [userName, setUserName] = useState("");
   useEffect(() => {
     const fetchUserData = async () => {
       try {
         const cookies = nookies.get(null);
         const email = cookies.email;
         if (email) {
           const decodedEmail = decodeURIComponent(email);
           const user = await getUserByEmail(decodedEmail);
           if (user.usuario) {
             setUserName(user.usuario.name);
           }
         }
       } catch (error) {
         console.error("Error fetching user:", error);
       }
     };
     if (isAuthenticated) fetchUserData();
   }, [isAuthenticated]);
   // Fin useEffect
 

    const handleDelete = async (id: number) => {
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
            const userData = response.usuario;
            let factories = [];
            try {
                factories = typeof userData.factory === "string" 
                    ? JSON.parse(userData.factory.replace(/\\/g, ""))
                    : Array.isArray(userData.factory) 
                    ? userData.factory 
                    : userData.factory 
                    ? [userData.factory] 
                    : [];
            } catch (parseError) {
                console.error("Error al parsear fábricas:", parseError);
            }
            setEditingUser(userData);
            setEditForm({
                name: userData.name || "",
                email: userData.email || "",
                role: userData.role || "",
                factory: factories,
            });
        } catch (error) {
            console.error("Error obteniendo datos del usuario:", error);
            showError("Error obteniendo datos del usuario");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (id: number) => {
        try {
            const updatedData = {
                ...editForm,
                factory: JSON.stringify(editForm.factory),
            };
            await updateUser(id, updatedData);
            setUsers(users.map(user => (user.id === id ? { ...user, ...editForm } : user)));
            setEditingUser(null);
            showSuccess("Usuario actualizado correctamente");
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            showError("Error al actualizar usuario");
        }
    };

    return (
        <div>
            {/* Pasa fetchUsers como prop a CreateUser */}
            <CreateUser onUserCreated={fetchUsers} />
            <Table columns={columns} rows={users} columnLabels={columnLabels} onDelete={handleDelete} onEdit={handleEdit} />
            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-96 animate-fade-in">
                        <h2 className="text-2xl font-bold text-black mb-4 text-center">Editar Usuario</h2>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleChange}
                            placeholder="Nombre"
                            className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleChange}
                            placeholder="Email"
                            className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            name="role"
                            value={editForm.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccionar rol</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                            ))}
                        </select>
                        <div className="mb-3">
                            <h3 className="text-black font-bold mb-2">Seleccionar Fábricas</h3>
                            {factories.map((factory) => (
                                <label key={factory.id} className="flex items-center space-x-2 text-black mb-1">
                                    <input
                                        type="checkbox"
                                        value={factory.id}
                                        checked={editForm.factory.includes(factory.id)}
                                        onChange={(e) => {
                                            const factoryId = Number(e.target.value);
                                            setEditForm((prevForm) => {
                                                const isAlreadySelected = prevForm.factory.includes(factoryId);
                                                const updatedFactories = isAlreadySelected
                                                    ? prevForm.factory.filter((id) => id !== factoryId)
                                                    : [...new Set([...prevForm.factory, factoryId])];
                                                return { ...prevForm, factory: updatedFactories };
                                            });
                                        }}
                                    />
                                    <span>{factory.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button onClick={() => handleSubmit(editingUser?.id ?? 0)} variant="save" />
                            <Button onClick={() => setEditingUser(null)} variant="cancel" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataUsers;