import axios from 'axios';
import { API_URL } from '../../config/api'
import { Plan } from "@/app/interfaces/EditPlanning";

// Se crea una instancia de axios con la configuración base de la API.
const Planning = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPlanning = async () => {
    try {
        const response = await Planning.get('/getPlan');
        return response.data.plan;
    } catch (error: unknown) {
        console.error("Error en getPlan:", error);
        throw error;
    }
}

export const getPlanningId = async (id: number) => {
    try {
        const response = await Planning.get(`/getPlanId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getPlanId:", error);
        throw error;
    }
}

export const updatePlanning = async (id: number, updatedPlan: Plan) => {
    try { 
        const response = await Planning.put(`/updatePlan/${id}`, updatedPlan); 
        return response.data;
    } catch (error: unknown) {
        console.error("Error en updatePlan:", error);
        throw error; 
    }
}