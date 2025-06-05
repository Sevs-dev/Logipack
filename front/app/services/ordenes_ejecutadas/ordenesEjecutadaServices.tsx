import axios from 'axios';
import { API_URL } from '../../config/api' 

// Instancia axios base
const Orden = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Función para obtener órdenes ejecutadas
export const getOrdenesEjecutadas = async (adaptation_id: number) => {
    try {
        const response = await Orden.get(`/getOrdenesEjecutadas/${adaptation_id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener órdenes');
    }
};

export const postOrdenesEjecutadas = async (data: any) => {
    try {
        const response = await Orden.post('/newOrdenesEjecutadas', data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al enviar órdenes');
    }
};

export const getOrdenEjecutadaById = async (id: number) => {
    try {
        const response = await Orden.get(`/newOrdenes/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener la orden');
    }
};

