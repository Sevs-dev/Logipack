// src/services/AuditService.ts
import axios from 'axios';
import { API_URL } from '../../config/api';

const Audit = axios.create({
    baseURL: `${API_URL}`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Obtener todas las auditorías
export const getAllAudits = async () => {
    try {
        const response = await Audit.get('/');
        return response.data;
    } catch (error) {
        console.error('Error al obtener auditorías:', error);
        throw error;
    }
};

// Obtener historial por modelo Activitie e ID 

export const getAuditsByModel = async (model: string, id: number) => {
    try {
        const response = await Audit.get(`/${model}/${id}`); 
        return response.data;
    } catch (error) {
        console.error(`Error al obtener auditoría de ${model} con ID ${id}:`, error);
        throw error;
    }
};

export const getAuditsByModelAdmin = async (model: string, id: number) => {
    console.log("Llamando a getAuditsByModelAdmin con model:", model, "y id:", id);
    try {
        const response = await Audit.get(`/audit/admin/${model}/${id}`); 
        return response.data;
    } catch (error) {
        console.error(`Error al obtener auditoría de ${model} con ID ${id}:`, error);
        throw error;
    }
};
export const getAuditsByModelAdaptation = async (model: string, id: number) => {
    try {
        const response = await Audit.get(`/audit/${model}/${id}`); 
        return response.data;
    } catch (error) {
        console.error(`Error al obtener auditoría de ${model} con ID ${id}:`, error);
        throw error;
    }
};



