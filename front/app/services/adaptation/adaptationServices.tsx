import axios from 'axios';
import { API_URL } from '../../config/api' 

// Se crea una instancia de axios con la configuración base de la API.
const Adaptations = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const newAdaptation = async (data: FormData) => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            data.append('user', decodeURIComponent(name));
        }
        const response = await Adaptations.post('/newAdaptation', data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        console.log("Creando adaptación:", response.data);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en newAdaptation:", error);
        throw error;
    }
};


export const getAdaptations = async () => {
    try {
        const response = await Adaptations.get('/getAdaptation');
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getAdaptations:", error);
        throw error; 
    }
}

export const getAdaptationsId = async (id: number) => {
    try {
        const response = await Adaptations.get(`/getAdaptationId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getAdaptations:", error);
        throw error;
    }
}

export const updateAdaptation = async (id: number, data: FormData) => {
    try {
        data.append("_method", "PUT");
        const response = await Adaptations.post(`/updateAdaptation/${id}`, data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        console.log("Editando adaptación:", response.data);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en updateAdaptation:", error);
        throw error; // Lanza otros errores para depuración
    }
};

export const deleteAdaptation = async (id: number) => {
    try {
        const response = await Adaptations.delete(`/deleteAdaptation/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en deleteAdaptation:", error);
        throw error; // Lanza otros errores para depuración
    }
}
