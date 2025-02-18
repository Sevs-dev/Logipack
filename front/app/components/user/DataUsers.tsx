"use client";
import React, { useState, useEffect } from "react";
import { getUsers, deleteUser, getDate, updateUser, getRole } from '../../services/authservices';
import Table from "../table/Table";

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
}

function DataUsers() {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
    const [users, setUsers] = useState<{ [key: string]: any }[]>([]);
    const columns = ["name", "email", "role"];
    const [roles, setRoles] = useState<Role[]>([]);
    const columnLabels: { [key: string]: string } = {
        name: "Nombre",
        email: "Email",
        role: "Rol",
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data: User[] = await getUsers();
                setUsers(data.map(user => ({
                    ...user,
                    role: user.role ? user.role : "Sin rol"
                })));
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await getRole();  // Usamos el servicio getRole
                setRoles(data); // Suponiendo que la respuesta tiene la forma [{ id, name }, ...]
            } catch (error) {
                console.error("Error fetching roles:", error);
            }
        };

        fetchRoles();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;
        try {
            await deleteUser(id);
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
            alert("Usuario eliminado con éxito"); // Muestra un mensaje de alerta
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
        }
    };    

    const handleEdit = async (id: number) => {
        try {
            const response = await getDate(id);
            const userData = response.usuario;

            setEditingUser(userData);
            setEditForm({
                name: userData.name,
                email: userData.email,
                role: userData.role || ""
            }); 
        } catch (error) {
            console.error("Error obteniendo datos del usuario:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (id: number) => {
        try {
            await updateUser(id, editForm);
            setUsers(users.map(user => (user.id === id ? { ...user, ...editForm } : user)));
            setEditingUser(null);
            alert("Usuario editado con éxito"); // Muestra un mensaje de alerta
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
        }
    };


    return (
        <div>
            <Table columns={columns} rows={users} columnLabels={columnLabels} onDelete={handleDelete} onEdit={handleEdit} />

            {/* MODAL DE EDICIÓN */}
            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4">Editar Usuario</h2>

                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleChange}
                            placeholder="Nombre"
                            className="w-full px-3 py-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleChange}
                            placeholder="Email"
                            className="w-full px-3 py-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            name="role"
                            value={editForm.role}  // Usar el valor del estado correcto
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="border p-2 mb-2 w-full"
                        >
                            <option value="">Seleccionar rol</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.name}>
                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => handleSubmit(editingUser?.id ?? 0)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                Guardar
                            </button>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataUsers;