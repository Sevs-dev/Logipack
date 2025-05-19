import axios from 'axios';
import { API_URL } from '../../config/api'


// Se crea una instancia de axios con la configuración base de la API.
const Consecutive = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const newConsecutive = async (data: FormData) => {
    try {
        const response = await Consecutive.post('/newConsecutive', data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en newConsecutive:", error);
        throw error;
    }
};

export const getConsecutives = async () => {
    try {
        const response = await Consecutive.get('/getConsecutiveDate');
        return response.data;
    } catch (error: any) {
        console.error("Error en getConsecutives:", error);
        throw error;
    }
};

export const getPrefix = async (prefix: string) => {
    try {
        const response = await Consecutive.get(`/getPrefix/${prefix}`);
        return response.data;
    } catch (error: any) {
        console.error("Error en getPrefix:", error);
        throw error;
    }
};

export const getConsecutivesId = async (id: number) => {
    try {
        const response = await Consecutive.get(`/getConsecutiveId/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("Error en getConsecutives:", error);
        throw error;
    }
}

export const updateConsecutive = async (id: number, data: FormData) => {
    try {
        data.append("_method", "PUT");
        const response = await Consecutive.post(`/updateConsecutive/${id}`, data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }               
        });
        console.log("Editando consecutivo:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error en updateConsecutive:", error);
        throw error;
    }
};

export const deleteConsecutive = async (id: number) => {
    try {
        const response = await Consecutive.delete(`/deleteConsecutive/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("Error en deleteConsecutive:", error);
        throw error;
    }
};

export const getConsecutiveById = async (id: number) => {
    try {
        const response = await Consecutive.get(`/getConsecutiveId/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("Error en getConsecutiveById:", error);
        throw error;
    }
};
