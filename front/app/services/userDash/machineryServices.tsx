import axios from 'axios';
import { API_URL } from '../../config/api';
import { MachineryForm } from '../../interfaces/NewMachine';

const Machinary = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const newMachin = async (data: MachineryForm) => {
    try {
        const response = await Machinary.post('/newMachin', data);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en newMachin:", error);
        throw error;
    }
};

export const getMachin = async () => {
    try {
        const response = await Machinary.get('/getMachin');
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getMachin:", error);
        throw error; // Lanza otros errores para depuración
    }
}

export const getMachinById = async (id: number) => {
    try {
        const response = await Machinary.get(`/MachinId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en MachinId:", error);
        throw error;
    }
}

export const updateMachin = async (id: number, data: MachineryForm) => {
    try {
        const response = await Machinary.put(`/updateMachin/${id}`, data);
        return response.data; 
    } catch (error) {
        console.error('Error en updateMachin:', error);
        throw error;
    }
};

export const deleteMachin = async (id: number) => {
    try {
        const response = await Machinary.delete(`/deleteMachin/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en deleteMachin:", error);
        throw error; // Lanza otros errores para depuración
    }
}

