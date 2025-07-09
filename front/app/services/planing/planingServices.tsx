import axios from 'axios';
import { API_URL } from '../../config/api'
import { PlanServ } from "@/app/interfaces/EditPlanning";

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

export const getActivitiesByPlanning = async (id: number) => {
    try {
        const response = await Planning.get(`/getPlanId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getPlanId:", error);
        throw error;
    }
}

export const updatePlanning = async (id: number, updatedPlan: PlanServ) => {
  try {
    const response = await Planning.put(`/updatePlan/${id}`, updatedPlan);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en updatePlan:", error);
    throw error;
  }
};

export const getPlanningById = async (id: number) => {
    try {
        const response = await Planning.get(`/getPlannId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getPlanId:", error);
        throw error;
    }
}

export const validate_orden = async (id: number) => {
    try {
        const response = await Planning.get(`/validar_estado/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getPlanId:", error);
        throw error;
    }
}

export const linea_procesos = async (id: number) => {
    try {
        const response = await Planning.get(`/linea_procesos/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getPlanId:", error);
        throw error;
    }
}

export const generar_orden = async (id: number) => {
    try {
        const response = await Planning.get(`/generar_orden/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en generar_orden:", error);
        throw error;
    }
}

export const siguiente_fase = async (id: number, linea: number, tipo: string) => {
    try {
        const response = await Planning.get(`/siguiente_fase/${id}/${linea}/${tipo}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en siguiente_fase:", error);
        throw error;
    }
}

export const fase_control = async (id: number) => {
    try {
        const response = await Planning.get(`/getFaseControl/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en fase_control:", error);
        throw error;
    }
}

export const guardar_formulario = async (data: any) => {
    try {
        const response = await Planning.post(`/guardar_actividades`, JSON.stringify(data));
        console.log(response.data);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en guardar_formulario:", error);
        throw error;
    }
}

export const getPlanningByIdPDF = async (id: number) => {
    try {
        const response = await Planning.get(`/getPlanByIdPDF/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getPlanByIdPDF:", error);
        throw error;
    }
}