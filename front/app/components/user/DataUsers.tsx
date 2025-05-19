"use client";
import React, { useState, useEffect } from "react";
import { getUsers, deleteUser, getDate, updateUser, getRole } from '../../services/userDash/authservices';
import { getFactory } from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import CreateUser from "./CreateUser";

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
    factory?: number[] | number;
}

interface Factory {
    id: number;
    name: string;
}

function DataUsers() {
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Formulario: role como string para el id del rol seleccionado
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        role: "", // guardamos el id del rol como string
        factory: [] as number[],
    });

    const [users, setUsers] = useState<User[]>([]);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const columns = ["name", "email", "role"];
    const columnLabels: { [key: string]: string } = {
        name: "Nombre",
        email: "Email",
        role: "Rol",
    };

    // Traer usuarios sin modificar tipo
    const fetchUsers = async () => {
        try {
            const data: User[] = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();

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
            const userData: User = response.usuario;

            // Parsear fábricas para que siempre sea number[]
            let factoriesParsed: number[] = [];
            try {
                if (typeof userData.factory === "string") {
                    // Si es string, parseamos JSON directamente sin replace
                    factoriesParsed = JSON.parse(userData.factory);
                } else if (Array.isArray(userData.factory)) {
                    factoriesParsed = userData.factory;
                } else if (typeof userData.factory === "number") {
                    factoriesParsed = [userData.factory];
                } else {
                    factoriesParsed = [];
                }
            } catch (parseError) {
                console.error("Error al parsear fábricas:", parseError);
            }

            setEditingUser(userData);
            setEditForm({
                name: userData.name || "",
                email: userData.email || "",
                // Si hay roles, toma el id del primero como string, si no ""
                role: userData.role && userData.role.length > 0 ? userData.role[0].id.toString() : "",
                factory: factoriesParsed,
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
            // Convertir factories a string para backend
            const updatedData = {
                ...editForm,
                factory: JSON.stringify(editForm.factory),
                // role viene como id string, aquí deberías enviarlo según cómo espera backend (ajustar si es diferente)
                role: editForm.role,
            };
            await updateUser(id, updatedData);
            // Actualiza users localmente, para el role reemplazamos con el objeto completo basado en el id
            const roleObj = roles.find(r => r.id.toString() === editForm.role);
            setUsers(users.map(user => (user.id === id
                ? { ...user, ...editForm, role: roleObj ? [roleObj] : [] }
                : user
            )));
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
                                <option key={role.id} value={role.id.toString()}>
                                    {role.name}
                                </option>
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
                            <Button onClick={() => handleSubmit(editingUser.id)} variant="save" />
                            <Button onClick={() => setEditingUser(null)} variant="cancel" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataUsers;
