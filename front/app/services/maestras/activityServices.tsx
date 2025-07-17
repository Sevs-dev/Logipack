import axios from 'axios';
import { API_URL } from '../../config/api'

// Se crea una instancia de axios con la configuración base de la API.
const Activitie = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Data {
    description: string;
    config: string;
    binding: boolean;
    has_time: boolean;
    duration?: number | null;
    user?: string;
}

// Función para crear un nuevo Activitie.
// Envía una solicitud POST a la ruta '/newActivitie' con los datos proporcionados.
export const createActivitie = async ( data: Data ): Promise<{ status: number; message?: string }> => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            data.user = decodeURIComponent(name);
        }

        const response = await Activitie.post('/newActividad', data);
        // console.log("Datos", response)
        return {
            status: response.status,
            message: response.data.message || "Actividad creada exitosamente",
        };
    } catch (error: unknown) {
        let errorMessage = "Error desconocido";

        if (typeof error === "object" && error !== null && "response" in error) {
            const axiosError = error as { response?: { data: unknown } };
            console.error("Detalles del error del backend:", axiosError.response?.data);
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        console.error('Error al crear la Actividad:', errorMessage);
        throw new Error(errorMessage);
    }
};


// Función para obtener todos los Activitie.
// Realiza una solicitud GET a la ruta '/getActivitie' y retorna los datos recibidos.
export const getActivitie = async () => {
    try {
        const response = await Activitie.get(`/getActividad`);
        return response.data;
    } catch (error) {
        console.error('Error en getActivitie:', error);
        throw error;
    }
};

// Función para eliminar un Activitie en específico por su ID.
// Realiza una solicitud DELETE a la ruta `/deleteActivitie/${id}`.
export const deleteActivitie = async (id: number) => {
    try {
        const response = await Activitie.delete(`/deleteActividad/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteActivitie:', error);
        throw error;
    }
};

// Función para obtener un Activitie específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getActivitieId = async (id: number) => {
    try {
        const response = await Activitie.get(`/ActividadId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getActividadId:', error);
        throw error;
    }
};

// Función para obtener un Activitie específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getActivitieName = async (name: string) => {
    try {
        const response = await Activitie.get(`/ActividadName/${name}`);
        return response.data;
    } catch (error) {
        console.error('Error en getActivitieId:', error);
        throw error;
    }
};

// Función para actualizar un Activitie existente.
// Envía una solicitud PUT a la ruta `/updateActivitie/${id}` con los nuevos datos del Activitie. 
export const updateActivitie = async (id: number, data: Data) => {

    try {
        const response = await Activitie.put(`/updateActividad/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateActivitie:', error);
        throw error;
    }
};

