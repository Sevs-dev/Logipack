import axios from 'axios';
import { API_URL } from '../../config/api'
import { Manu, Factory, Product } from "../../interfaces/Products"

// Se crea una instancia de axios con la configuración base de la API.
const apiManu = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export const createManu = async (dataManuData: Manu): Promise<void> => {
    try {
        const response = await apiManu.post('/newManu', dataManuData);
        return response.data;
    } catch (error) {
        console.error('Error al crear la fábrica:', error);
        throw error;
    }
};

export const getManu = async () => {
    try {
        const response = await apiManu.get(`/getManu`);
        return response.data;
    } catch (error) {
        console.error('Error en getManu:', error);
        throw error;
    }
}

export const deleteManu = async (id: number) => {
    try {
        const response = await apiManu.delete(`/deleteManu/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteManu:', error);
        throw error;
    }
}

export const getManuId = async (id: number) => {
    try {
        const response = await apiManu.get(`/ManuId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getManuId:', error);
        throw error;
    }
}

export const updateManu = async (id: number, data: { name: string; products: number[] }) => {
    try {
        const response = await apiManu.put(`/updateManu/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateManu:', error);
        throw error;
    }
};
