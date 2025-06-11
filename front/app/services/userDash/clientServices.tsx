import axios, { AxiosError } from 'axios';
import { API_URL } from '../../config/api';
import { Client, ClientInput, ApiError } from "../../interfaces/Client"

// Axios Instance
const apiClients = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Create
export const createClients = async (dataClientsData: ClientInput): Promise<Client> => {
    try {
        const response = await apiClients.post<Client>('/newClients', dataClientsData);
        return response.data;
    } catch (error: unknown) {
        handleClientError(error, 'crear el cliente');
    }
};

// Get All
export const getClients = async (): Promise<Client[]> => {
    try {
        const response = await apiClients.get<Client[]>('/getClients');
        return response.data;
    } catch (error: unknown) {
        handleClientError(error, 'obtener clientes');
    }
};

// Delete
export const deleteClients = async (id: number): Promise<{ message: string }> => {
    try {
        const response = await apiClients.delete<{ message: string }>(`/deleteClients/${id}`);
        return response.data;
    } catch (error: unknown) {
        handleClientError(error, 'eliminar cliente');
    }
};

// Get by ID
export const getClientsId = async (id: number): Promise<Client> => {
    try {
        const response = await apiClients.get<Client>(`/ClientsId/${id}`);
        return response.data;
    } catch (error: unknown) {
        handleClientError(error, 'obtener cliente por ID');
    }
};

// Update
export const updateClients = async (id: number, data: Partial<ClientInput>): Promise<Client> => {
    try {
        const payload = {
            ...data,
            responsible_person: data.responsible_person ?? [],
        };
        const response = await apiClients.put<Client>(`/updateClients/${id}`, payload);
        return response.data;
    } catch (error: unknown) {
        handleClientError(error, 'actualizar cliente');
    }
};

// Manejador de errores
function handleClientError(error: unknown, contexto: string): never {
    if (axios.isAxiosError(error)) {
        const err = error as AxiosError<ApiError>;
        const msg = err.response?.data?.message || err.message;
        console.error(`Error al ${contexto}:`, msg);
        throw new Error(msg);
    }
    throw new Error(`Error desconocido al ${contexto}`);
}
