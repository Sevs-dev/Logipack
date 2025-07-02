import axios from 'axios';
import { API_URL } from '../../config/api';
import { TimerControlData, TimerControlResponse } from '../../interfaces/TimerController';

const TControl = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const createTimerControl = async (data: TimerControlData): Promise<TimerControlResponse> => {
    try {
        const response = await TControl.post('/newTcontrol', data);
        return response.data;
    } catch (error) {
        console.error('Error en createTimerControl:', error);
        throw error;
    }
}