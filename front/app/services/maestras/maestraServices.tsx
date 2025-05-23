import axios from 'axios';
import { API_URL } from '../../config/api';
import { DataService } from '../../interfaces/NewMaestra';

const Maestras = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Crear una nueva Maestra
export const createMaestra = async (data: DataService): Promise<any> => {
    try {
        const response = await Maestras.post('/newMaestra', data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error al crear la maestra:', error.response?.data || error.message);
            // Re-lanzamos el error pero ahora con más info, por si quieres manejarlo después
            throw error.response?.data || error;
        } else {
            console.error('Error inesperado al crear la maestra:', error);
            throw error;
        }
    }
};


// Obtener todas las Maestras
export const getMaestra = async (): Promise<any> => {
    try {
        const response = await Maestras.get('/getMaestra');
        return response.data;
    } catch (error) {
        console.error('Error en getMaestra:', error);
        throw error;
    }
};

export const getTipo = async () => {
    try {
        const response = await Maestras.get(`/getTipo`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            console.warn(`No se encontraron Tipos`);
            return [];
        } else {
            console.error("Error en getTipo:", error);
            throw error;
        }
    }
};

// Eliminar una Maestra por su ID
export const deleteMaestra = async (id: number): Promise<any> => {
    try {
        const response = await Maestras.delete(`/deleteMaestra/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteMaestra:', error);
        throw error;
    }
};

// Obtener una Maestra por su ID
export const getMaestraId = async (id: number): Promise<any> => {
    try {
        const response = await Maestras.get(`/MaestraId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getMaestraId:', error);
        throw error;
    }
};

// Obtener una Maestra por su nombre
export const getMaestraName = async (name: string): Promise<any> => {
    try {
        const response = await Maestras.get(`/MaestraName/${name}`);
        return response.data;
    } catch (error) {
        console.error('Error en getMaestraName:', error);
        throw error;
    }
};

// Actualizar una Maestra
export const updateMaestra = async (id: number, data: DataService): Promise<any> => {
    try {
        const response = await Maestras.put(`/updateMaestra/${id}`, data);
        return response.data;
    } catch (error: any) {
        console.error('Error en updateMaestra:', error.response?.data || error.message);
        throw error;
    }
};

