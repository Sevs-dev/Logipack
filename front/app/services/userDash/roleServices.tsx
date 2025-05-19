import axios from 'axios';

import { API_URL } from '../../config/api' 

// Se crea una instancia de axios con la configuración base de la API.
const apiRole = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPermissions = async () => {
    try {
        const response = await apiRole.get('/permissions');
        return response.data;
    } catch (error) {
        console.error('Error en getPermissions:', error);
        throw error;
    }
};

export const updateRolePermissions = async (roleId: number, permissionIds: number) => {
    try {
        await apiRole.post(`/permissionsUpdate/`, { roleId, permissionIds });
    } catch (error) {
        console.error("Error actualizando permisos:", error);
        throw error;
    }
};

export const getPermissionRole = async (role: string) => {
    try {
        const response = await apiRole.get(`/role-permissions/${role}`);
        return response.data;
    } catch (error) {
        console.error("Error en getPermissionRole:", error);
        throw error;
    }
}

export const createPermission = async (name: string, description: string, status: number) => {
    try {
        const response = await apiRole.post('/newPermission', { name, description, status });
        return response.data;
    } catch (error: unknown) {
        console.error('Error en createPermission:', error);
        throw error;
    }
}

export const deletePermission = async (id: number) => {
    try {
        const response = await apiRole.delete(`/deletePermission/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deletePermission:', error);
        throw error;
    }
}

export const getPermissionId = async (id: number) => {
    try {
        const response = await apiRole.get(`/PermissionId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en PermissionId:', error);
        throw error;
    }
}

export const updatePermission = async (id: number, data: {name: string,description: string, status: number}) => {
    try {
        const response = await apiRole.put(`/updatePermission/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updatePermission:', error);
        throw error;
    }
};