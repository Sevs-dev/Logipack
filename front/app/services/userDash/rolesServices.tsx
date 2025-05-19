import axios from 'axios';
import { API_URL } from '../../config/api';

// Se crea una instancia de axios configurada con la URL base de la API y encabezados predeterminados.
const apiRoles = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interfaz que define la estructura de los datos para crear o actualizar un Role.
// En este caso, solo se requiere el campo "name".
export interface Data {
    name: string;
}

// Función para crear un nuevo Role.
// Envía una solicitud POST a la ruta '/newRole' con los datos proporcionados.
export const createRole = async (data: { name: string }) => {
    const response = await apiRoles.post('/newRole', data);
    return response.data;
};

// Función para obtener todos los Roles.
// Realiza una solicitud GET a la ruta '/getRole' y retorna los datos recibidos.
export const getRole = async () => {
    try {
        const response = await apiRoles.get(`/getRole`);
        return response.data;
    } catch (error) {
        console.error('Error en getRole:', error);
        throw error;
    }
};

// Función para eliminar un Role en específico por su ID.
// Realiza una solicitud DELETE a la ruta `/deleteRole/${id}`.
export const deleteRole = async (id: number) => {
    try {
        const response = await apiRoles.delete(`/deleteRole/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteRole:', error);
        throw error;
    }
};

// Función para obtener un Role específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getRoleId = async (id: number) => {
    try {
        const response = await apiRoles.get(`/RoleId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getRoleId:', error);
        throw error;
    }
};

// Función para actualizar un Role existente.
// Envía una solicitud PUT a la ruta `/updateRole/${id}` con los nuevos datos del Role. 
export const updateRole = async (id: number, data: { name: string }) => {
    try {
        const response = await apiRoles.put(`/updateRole/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateRole:', error);
        throw error;
    }
};
