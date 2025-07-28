import axios from 'axios';
import { API_URL } from '../../config/api';

export interface TimerData {
    ejecutada_id: number;
    stage_id: number;
    time: number;
}

export interface TimerResponse {
    id: number;
    ejecutada_id: number;
    stage_id: number;
    time: number;
    status: 'running' | 'paused' | 'finished';
    pause: number;
    pause_time: number;
    finish: number;
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
export const createTimer = async (data: TimerData): Promise<TimerResponse | { exists: true }> => { 
    try {
        const response = await apiTimer.post('/newTimer', data); 
        return response.data;
    } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
            return { exists: true };
        } else {
            handleError('createTimer', error);
            throw error;
        }
    }
};

export const pauseTimer = async (payload: { ejecutada_id: number; pause_time: number }) => {
    try {
        console.log('🚀 pauseTimer payload:', payload);
        const response = await apiTimer.patch('/timers/pause', payload);
        console.log('📡 pauseTimer response.data:', response.data);
        return response.data;
    } catch (error) {
        console.error('🔥 Error en pauseTimer service:', error);
        throw error;
    }
};

// Finalizar un timer (por id)
export const finishTimer = async (payload: { ejecutada_id: number; pause_time: number }) => {
    try {
        const response = await apiTimer.patch('/timers/finish', payload);
        return response.data.timer;
    } catch (error) {
        handleError('finishTimer', error);
        throw error;
    }
};

// Reiniciar un timer (por id)
export const resetTimer = async (payload: { ejecutada_id: number; time_reset: number }): Promise<TimerResponse> => {
    try {
        const response = await apiTimer.patch('/timers/reset', payload);
        return response.data.timer;
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

// Listar timers (sin filtros)
export const getTimers = async (): Promise<TimerResponse[]> => {
    try {
        const response = await apiTimer.get('/getTimer');
        return response.data;
    } catch (error) {
        handleError('getTimers', error);
        throw error;
    }
};

// Obtener un timer por ejecutada_id
export const getTimerEjecutadaById = async (ejecutada_id: number): Promise<{ exists: boolean; timer: TimerResponse | null }> => {
    try {
        const response = await apiTimer.get(`/timers/by-ejecutada/${ejecutada_id}`);
        return response.data;
    } catch (error) {
        handleError('getTimerEjecutadaById', error);
        throw error;
    }
};


export const getcontrolTimer = async (timerId: number): Promise<any[]> => {
    try {
        const response = await apiTimer.get(`/getFaseTimer/control/${timerId}`);
        const fases = Array.isArray(response.data.maestra_fases_fk?.[0])
            ? response.data.maestra_fases_fk[0]
            : [];

        return fases;
    } catch (error: unknown) {
        throw new Error(
            axios.isAxiosError(error) && error.response?.data?.message
                ? error.response.data.message
                : 'Error al obtener el control del timer'
        );
    }
};
