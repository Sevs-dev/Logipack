import axios from 'axios';
import { API_URL } from '../../config/api'
import { FactoryData } from "../../interfaces/NewFactory"

// Se crea una instancia de axios con la configuración base de la API.
const apiFactory = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interfaz para definir la estructura de los datos de la fábrica


// Función para crear una nueva fábrica
export const createFactory = async (dataFactory: FactoryData): Promise<void> => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            dataFactory.user = decodeURIComponent(name);
        }
        const response = await apiFactory.post('/newFactory', dataFactory);
        return response.data;
    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "response" in error) {
            const axiosError = error as { response?: { data: unknown } };
            console.error("Detalles del error del backend:", axiosError.response?.data);
        }
        throw error;
    }
};


export const getFactory = async () => {
    try {
        const response = await apiFactory.get(`/getFactories`);
        return response.data;
    } catch (error) {
        console.error('Error en getFactory:', error);
        throw error;
    }
}

export const deleteFactory = async (id: number) => {
    try {
        const response = await apiFactory.delete(`/deleteFactory/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteUser:', error);
        throw error;
    }
}

export const getFactoryId = async (id: number) => {
    try {
        const response = await apiFactory.get(`/factoryId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en factoryId:', error);
        throw error;
    }
}


export const updateFactory = async (id: number, dataFactory: FactoryData): Promise<void> => {
    try {
        const response = await apiFactory.put(`/updateFactory/${id}`, dataFactory);
        return response.data;
    } catch (error) {
        console.error('Error en updateFactory:', error);
        throw error;
    }
}