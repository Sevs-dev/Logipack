import axios from 'axios';
import { API_URL } from '../../config/api';
import { MaestraBase, DataService, MaestraResponse, MaestrasServ } from '../../interfaces/NewMaestra';

const Maestras = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createMaestra = async (data: MaestrasServ): Promise<MaestraResponse> => {
  try {
    const name = document.cookie
      .split('; ')
      .find(row => row.startsWith('name='))
      ?.split('=')[1];

    if (name) {
      data.user = decodeURIComponent(name);
    }
    const response = await Maestras.post("/newMaestra", data);
    return response.data;
  } catch (error: unknown) {
    handleError("newMaestra", error);
    throw error;
  }
};

export const getMaestra = async (): Promise<MaestraBase[]> => {
  try {
    const response = await Maestras.get("/getMaestra");
    return response.data;
  } catch (error: unknown) {
    handleError("getMaestra", error);
    throw error;
  }
};

export const getTipo = async (): Promise<string[]> => {
  try {
    const response = await Maestras.get("/getTipo");
    return response.data;
  } catch (error: unknown) {
    handleError("getTipo", error);
    throw error;
  }
};

export const deleteMaestra = async (id: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await Maestras.delete(`/deleteMaestra/${id}`);
    return response.data;
  } catch (error: unknown) {
    handleError("deleteMaestra", error);
    throw error;
  }
};

export const getMaestraId = async (id: number): Promise<MaestraBase> => {
  try {
    const response = await Maestras.get(`/MaestraId/${id}`);
    return response.data;
  } catch (error: unknown) {
    handleError("getMaestraId", error);
    throw error;
  }
};

export const getMaestraName = async (name: string): Promise<MaestraBase[]> => {
  try {
    const response = await Maestras.get(`/MaestraName/${name}`);
    return response.data;
  } catch (error: unknown) {
    handleError("getMaestraName", error);
    throw error;
  }
};

export const updateMaestra = async (id: number, data: DataService): Promise<MaestraResponse> => {
  try {
    const response = await Maestras.put(`/updateMaestra/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    handleError("updateMaestra", error);
    throw error;
  }
};

// Manejo centralizado de errores
const handleError = (fnName: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error(`Error en ${fnName}:`, error.response?.data || error.message);
  } else {
    console.error(`Error inesperado en ${fnName}:`, error);
  }
};
