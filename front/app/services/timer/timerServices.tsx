import axios from 'axios';
import { API_URL } from '../../config/api';

export interface TimerData {
    adaptation_id: number;
    stage_id: number;
    time: number;
    user?: string;
}

export interface TimerResponse {
    id: number;
    adaptation_id: number;
    stage_id: number;
    time: number;
    status: 'running' | 'paused' | 'finished';
    created_at: string;
    updated_at: string;
}

const apiTimer = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const handleError = (action: string, error: unknown) => {
    console.error(`Error en acción [${action}]:`, error);
};

// Crear un timer
export const createTimer = async (data: TimerData): Promise<TimerResponse> => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            data.user = decodeURIComponent(name);
        }

        const response = await apiTimer.post('/newTimer', data);
        return response.data;
    } catch (error) {
        handleError('createTimer', error);
        throw error;
    }
};

// Pausar un timer
export const pauseTimer = async (id: number): Promise<TimerResponse> => {
    try {
        const response = await apiTimer.patch(`/pauseTimer/${id}`);
        return response.data;
    } catch (error) {
        handleError('pauseTimer', error);
        throw error;
    }
};

// Finalizar un timer
export const finishTimer = async (id: number): Promise<TimerResponse> => {
    try {
        const response = await apiTimer.patch(`/finishTimer/${id}`);
        return response.data;
    } catch (error) {
        handleError('finishTimer', error);
        throw error;
    }
};

// Reiniciar un timer
export const resetTimer = async (id: number): Promise<TimerResponse> => {
    try {
        const response = await apiTimer.patch(`/resetTimer/${id}`);
        return response.data;
    } catch (error) {
        handleError('resetTimer', error);
        throw error;
    }
};

// Obtener un timer por ID
export const getTimerById = async (id: number): Promise<TimerResponse> => {
    try {
        const response = await apiTimer.get(`/getTimer/${id}`);
        return response.data;
    } catch (error) {
        handleError('getTimerById', error);
        throw error;
    }
};

// Listar timers (opcionalmente filtrando por adaptation_id y stage_id)
export const getTimers = async (params?: { adaptation_id?: number; stage_id?: number }): Promise<TimerResponse[]> => {
    try {
        const response = await apiTimer.get('/getTimer', { params });
        return response.data;
    } catch (error) {
        handleError('getTimers', error);
        throw error;
    }
};
