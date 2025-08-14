import axios from 'axios';
import { API_URL } from '../../config/api';
import { Data } from "../../interfaces/Products"

const apiRoles = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Role {
    id: number;
    name: string;
}

// Crear un nuevo rol
export const createRole = async (data: Data): Promise<Role> => {
    const name = document.cookie
        .split('; ')
        .find(row => row.startsWith('name='))
        ?.split('=')[1];

    if (name) {
        data.user = decodeURIComponent(name);
    }
    const response = await apiRoles.post('/newRole', data);
    return response.data.Role; // accedemos directamente al objeto
};

// Obtener todos los roles
export const getRole = async (): Promise<Role[]> => {
    const response = await apiRoles.get('/getRole');
    return response.data;
};

// Obtener un rol por ID
export const getRoleId = async (id: number): Promise<Role> => {
    const response = await apiRoles.get(`/RoleId/${id}`);
    return response.data;
};

// Actualizar un rol por ID
export const updateRole = async (id: number, data: Data): Promise<Role> => {
    const name = document.cookie
        .split('; ')
        .find(row => row.startsWith('name='))
        ?.split('=')[1];

    if (name) {
        data.user = decodeURIComponent(name);
    } 
    const response = await apiRoles.put(`/updateRole/${id}`, data);
    return response.data.Role;
};

// Eliminar un rol por ID
export const deleteRole = async (id: number): Promise<{ message: string }> => {
    const response = await apiRoles.delete(`/deleteRole/${id}`);
    return response.data;
};
