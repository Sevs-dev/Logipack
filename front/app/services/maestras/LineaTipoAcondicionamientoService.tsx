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
    tipo_acondicionamiento_id: number;
    orden: number;
    descripcion: string;    
    fase: string;
    editable: boolean;
    control: boolean;
    fase_control: string;
}

 
// Función para crear un nuevo Stage.
// Envía una solicitud POST a la ruta '/newStage' con los datos proporcionados.
export const createStage = async (data: Data): Promise<{ status: number; message?: string }> => {
    try {
        const response = await Stage.post('/newLineaTipoAcondicionamiento', data);
        return {
            status: response.status,
            message: response.data.message, // Suponiendo que el backend devuelve un campo `message`
        };
    } catch (error) {
        console.error('Error al crear la linea de tipo de acondicionamiento:', error);
        throw error;
    }
};

// Función para obtener todos los Stage.
// Realiza una solicitud GET a la ruta '/getStage' y retorna los datos recibidos.
export const getStage = async () => {   
    try {
        const response = await Stage.get(`/getLineaTipoAcondicionamiento`);
        return response.data;
    } catch (error) {
        console.error('Error en getLineaTipoAcondicionamiento:', error);
        throw error;
    }
};


// Realiza una solicitud DELETE a la ruta `/deleteStage/${id}`.
export const deleteStage = async (id: number) => {
    try {
        const response = await Stage.delete(`/deleteLineaTipoAcondicionamiento/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteLineaTipoAcondicionamiento:', error);
        throw error;
    }
};

// Función para actualizar un Stage existente.
// Envía una solicitud PUT a la ruta `/updateStage/${id}` con los nuevos datos del Stage. 
export const updateLineaTipoAcondicionamiento = async (id: number, data: Data) => {
    try {
        const response = await Stage.put(`/updateLineaTipoAcondicionamiento/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateLineaTipoAcondicionamiento:', error);
        throw error;
    }
};

// buscar una linea de tipo de acondicionamiento por id
export const getLineaTipoAcondicionamientoById = async (id: number) => {
    try {
        const response = await Stage.get(`/getLineaTipoAcondicionamiento/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getLineaTipoAcondicionamientoById:', error);
        throw error;
    }
}   

// buscar una linea de tipo de acondicionamiento por id
export const getListTipoyLineas = async (id: number) => {
    try {
        const response = await Stage.get(`/getListTipoyLineas/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getListTipoyLineas:', error);
        throw error;
    }
}

// obtener las fases y los controles
export const getSelectStagesControls = async () => {
    try {
        const response = await Stage.get(`/getSelectStages`);
        return response.data;
    } catch (error) {
        console.error('Error en getSelectStages:', error);
        throw error;
    }
}
