import axios from 'axios';
import { API_URL } from '../../config/api'

// Se crea una instancia de axios con la configuración base de la API.
const Stage = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Data {
    description: string;
    phase_type: string;
    repeat: boolean;
    repeat_minutes?: number;
    alert: boolean;
    can_pause: boolean;
    status: boolean;
    activities: string;
}

 
// Función para crear un nuevo Stage.
// Envía una solicitud POST a la ruta '/newStage' con los datos proporcionados.
export const createStage = async (data: Data): Promise<{ status: number; message?: string }> => {
    try {
        const response = await Stage.post('/newFase', data);
        return {
            status: response.status,
            message: response.data.message, // Suponiendo que el backend devuelve un campo `message`
        };
    } catch (error) {
        console.error('Error al crear la fase:', error);
        throw error;
    }
};

// Función para obtener todos los Stage.
// Realiza una solicitud GET a la ruta '/getStage' y retorna los datos recibidos.
export const getStage = async () => {
    try {
        const response = await Stage.get(`/getFase`);
        return response.data;
    } catch (error) {
        console.error('Error en getStage:', error);
        throw error;
    }
};

// Función para eliminar un Stage en específico por su ID.
// Realiza una solicitud DELETE a la ruta `/deleteStage/${id}`.
export const deleteStage = async (id: number) => {
    try {
        const response = await Stage.delete(`/deleteFase/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteStage:', error);
        throw error;
    }
};

// Función para obtener un Stage específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getStageId = async (id: number) => {
    try {
        const response = await Stage.get(`/FaseId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getFaseId:', error);
        throw error;
    }
};

// Función para obtener un Stage específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getStageName = async (name: string) => {
    try {
        const response = await Stage.get(`/FaseName/${name}`);
        return response.data;
    } catch (error) {
        console.error('Error en getStageId:', error);
        throw error;
    }
};

// Función para actualizar un Stage existente.
// Envía una solicitud PUT a la ruta `/updateStage/${id}` con los nuevos datos del Stage. 
export const updateStage = async (id: number, data: Data) => {
    try {
        const response = await Stage.put(`/updateFase/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateStage:', error);
        throw error;
    }
};

