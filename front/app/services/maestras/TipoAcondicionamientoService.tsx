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
    id: number;
    descripcion: string;
    status: boolean;
}

 
// Función para crear un nuevo Stage.
// Envía una solicitud POST a la ruta '/newStage' con los datos proporcionados.
export const createStage = async (data: Data): Promise<{ status: number; message?: string; id?: number }> => {
    try {
        const response = await Stage.post('/newTipoAcondicionamiento', data);
        return {
            status: response.status,
            message: response.data.message, // Suponiendo que el backend devuelve un campo `message`
            id: response.data.id // Retorna solo el ID
        };
    } catch (error) {
        console.error('Error al crear el tipo de acondicionamiento:', error);
        throw error;
    }
};

// Función para obtener todos los Stage.
// Realiza una solicitud GET a la ruta '/getStage' y retorna los datos recibidos.
export const getStage = async () => {   
    try {
        const response = await Stage.get(`/getTipoAcondicionamiento`);
        return response.data;
    } catch (error) {
        console.error('Error en getTipoAcondicionamiento:', error);
        throw error;
    }
};


// Realiza una solicitud DELETE a la ruta `/deleteStage/${id}`.
export const deleteStage = async (id: number) => {
    try {
        const response = await Stage.delete(`/deleteTipoAcondicionamiento/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteTipoAcondicionamiento:', error);
        throw error;
    }
};

// Función para actualizar un Stage existente.
// Envía una solicitud PUT a la ruta `/updateStage/${id}` con los nuevos datos del Stage. 
export const updateTipoAcondicionamiento = async (id: number, data: Data) => {
    try {
        const response = await Stage.put(`/updateTipoAcondicionamiento/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateTipoAcondicionamiento:', error);
        throw error;
    }
};
