import axios from 'axios';
import { API_URL } from '../../config/api'
import { Manu } from "../../interfaces/Products"

// Se crea una instancia de axios con la configuración base de la API.
const Manufac = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export const createManu = async (dataManuData: Manu): Promise<void> => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            dataManuData.user = decodeURIComponent(name);
        }
        const response = await Manufac.post('/newManu', dataManuData);
        return response.data;
    } catch (error) {
        console.error('Error al crear la fábrica:', error);
        throw error;
    }
};

export const getManu = async () => {
    try {
        const response = await Manufac.get(`/getManu`);
        return response.data;
    } catch (error) {
        console.error('Error en getManu:', error);
        throw error;
    }
}

export const deleteManu = async (id: number) => {
    try {
        const response = await Manufac.delete(`/deleteManu/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteManu:', error);
        throw error;
    }
}

export const getManuId = async (id: number) => {
    try {
        const response = await Manufac.get(`/ManuId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getManuId:', error);
        throw error;
    }
}

export const updateManu = async (id: number, data: Manu) => {
    try {
        const response = await Manufac.put(`/updateManu/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateManu:', error);
        throw error;
    }
};
