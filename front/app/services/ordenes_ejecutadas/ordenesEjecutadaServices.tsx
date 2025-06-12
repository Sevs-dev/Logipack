import axios from 'axios';
import { API_URL } from '../../config/api';
import { OrdenEjecutada, NuevaOrdenPayload } from '../../interfaces/OrdenesEjecutadas'; // si los movés a otro archivo

const Orden = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Obtener lista de órdenes
export const getOrdenesEjecutadas = async (adaptation_id: number): Promise<OrdenEjecutada[]> => {
  try {
    const response = await Orden.get<OrdenEjecutada[]>(`/getOrdenesEjecutadas/${adaptation_id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Error al obtener órdenes'
    );
  }
};

// Enviar nueva orden
export const postOrdenesEjecutadas = async (data: NuevaOrdenPayload): Promise<OrdenEjecutada> => {
  try {
    const response = await Orden.post<OrdenEjecutada>('/newOrdenesEjecutadas', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Error al enviar órdenes'
    );
  }
};

// Obtener una orden por ID
export const getOrdenEjecutadaById = async (id: number): Promise<OrdenEjecutada> => {
  try {
    const response = await Orden.get<OrdenEjecutada>(`/newOrdenes/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Error al obtener la orden'
    );
  }
};
