import axios from 'axios';
import { API_URL } from '../../config/api'

// Se crea una instancia de axios con la configuración base de la API.
const Articles = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getArticleByCode = async (code: string) => {
    try {
        const response = await Articles.get(`/getCode/${code}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            console.warn(`No se encontraron artículos para el código: ${code}`);
            return [];
        } else {
            console.error("Error en getArticleByCode:", error);
            throw error; // Lanza otros errores para depuración
        }
    }
};

export const getBoms = async () => {
    try {
        const response = await Articles.get('/getBom');
        return response.data;
    } catch (error: any) {
        console.error("Error en getBoms:", error);
        throw error;
    }
}

export const newArticle = async (article: any) => {
    try {
        const response = await Articles.post('/newArticle', article);
        return response.data;
    } catch (error: any) {
        console.error("Error en newArticle:", error);
        throw error; // Lanza otros errores para depuración
    }
}

export const getArticlesId = async (id: number) => {
    try {
        const response = await Articles.get(`/getArticleId/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("Error en getArticles:", error);
        throw error; // Lanza otros errores para depuración
    }
}

export const updateArticle = async (id: number, article: any) => {
    try {
        const response = await Articles.put(`/updateArticle/${id}`, article);
        return response.data;
    } catch (error: any) {
        console.error("Error en updateArticle:", error);
        throw error; // Lanza otros errores para depuración
    }
}

export const deleteArticle = async (id: number) => {
    try {
        const response = await Articles.delete(`/deleteArticle/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("Error en deleteArticle:", error);
        throw error; // Lanza otros errores para depuración
    }
}


