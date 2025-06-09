import axios from 'axios';
import { API_URL } from '../../config/api';
import { Article, Bom, BomPayload } from '@/app/interfaces/BOM';

// Instancia axios base
const Articles = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tipado del response.data esperado para cada función

export const getArticleByCode = async (code: string): Promise<Article> => {
    try {
        const response = await Articles.get<Article>(`/getCode/${code}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getArticleByCode:", error);
        throw error;
    }
};

export const getBoms = async () => {
    try {
        const response = await Articles.get('/getBom');
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getBoms:", error);
        throw error;
    }
}

export const newArticle = async (bom: BomPayload): Promise<Bom> => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            bom.user = decodeURIComponent(name);
        }
        const response = await Articles.post<Bom>('/newArticle', bom); 
        return response.data;
    } catch (error: unknown) {
        console.error("Error en newArticle:", error);
        throw error;
    }
};

export const getArticlesId = async (id: number): Promise<Article> => {
    try {
        const response = await Articles.get<Article>(`/getArticleId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getArticles:", error);
        throw error;
    }
};

export const getArticleByClient = async (id: number): Promise<Article[]> => {
    try {
        const response = await Articles.get<Article[]>(`/getArticleByClientId/${id}`);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en getArticleByClient:", error);
        throw error;
    }
};

export const updateArticle = async (id: number, bom: BomPayload): Promise<Bom> => {
    try {
        const response = await Articles.put<Bom>(`/updateArticle/${id}`, bom);
        return response.data;
    } catch (error: unknown) {
        console.error("Error en updateArticle:", error);
        throw error;
    }
};

export const deleteArticle = async (id: number): Promise<void> => {
    try {
        await Articles.delete(`/deleteArticle/${id}`);
    } catch (error: unknown) {
        console.error("Error en deleteArticle:", error);
        throw error;
    }
};
