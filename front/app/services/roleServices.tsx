import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Se crea una instancia de axios con la configuración base de la API.
const authUser = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPermissions = async () => {
    try {
        const response = await authUser.get('/permissions');
        return response.data;
    } catch (error) {
        console.error('Error en getPermissions:', error);
        throw error;
    }
};

export const updateRolePermissions = async (roleId: number, permissionIds: number[]) => {
    console.log('Actualizando permisos:', roleId, permissionIds);
    try {
        await authUser.post(`/permissions/${roleId}`, { permissions: permissionIds });
    } catch (error) {
        console.error("Error actualizando permisos:", error);
        throw error;
    }
};

