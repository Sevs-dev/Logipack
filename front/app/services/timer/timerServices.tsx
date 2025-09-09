import axios from "axios";
import { API_URL } from "../../config/api";

export interface TimerData {
  ejecutada_id: number;
  stage_id: number;
  time: number;
  // ⬇️ opcionales, compatibles con tu backend
  orden_id?: string;
  control_id?: number | null;
}

export interface TimerResponse {
  id: number;
  ejecutada_id: number;
  stage_id: number;
  time: number;
  status: "running" | "paused" | "finished" | "0";
  pause: number;
  pause_time: number;
  finish: number;
  created_at: string;
  updated_at: string;
}

const apiTimer = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const handleError = (action: string, error: unknown) => {
  console.error(`Error en acción [${action}]:`, error);
};

// Crear un timer
export const createTimer = async (data: TimerData): Promise<TimerResponse | { exists: true }> => {
  try {
    const response = await apiTimer.post("/newTimer", data);
    return response.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 409) {
      return { exists: true };
    } else {
      handleError("createTimer", error);
      throw error;
    }
  }
};

export const pauseTimer = async (payload: { ejecutada_id: number; pause_time: number }) => {
  try {
    const response = await apiTimer.patch("/timers/pause", payload);
    return response.data;
  } catch (error) {
    handleError("pauseTimer", error);
    throw error;
  }
};

// Finalizar un timer
export const finishTimer = async (payload: { ejecutada_id: number; pause_time: number }) => {
  try {
    const response = await apiTimer.patch("/timers/finish", payload);
    return response.data.timer as TimerResponse;
  } catch (error) {
    handleError("finishTimer", error);
    throw error;
  }
};

// Reiniciar un timer — OJO: endpoint correcto según tus rutas
export const resetTimer = async (payload: { ejecutada_id: number; time_reset: number }): Promise<TimerResponse> => {
  try {
    const response = await apiTimer.patch("/timers/resetTimer", payload);
    return response.data.timer as TimerResponse;
  } catch (error) {
    handleError("resetTimer", error);
    throw error;
  }
};

export const getTimerById = async (id: number): Promise<TimerResponse> => {
  try {
    const response = await apiTimer.get(`/getTimer/${id}`);
    return response.data as TimerResponse;
  } catch (error) {
    handleError("getTimerById", error);
    throw error;
  }
};

export const getTimers = async (): Promise<TimerResponse[]> => {
  try {
    const response = await apiTimer.get("/getTimer");
    return response.data as TimerResponse[];
  } catch (error) {
    handleError("getTimers", error);
    throw error;
  }
};

// Obtener por ejecutada_id
export const getTimerEjecutadaById = async (
  ejecutada_id: number
): Promise<{ exists: boolean; timer: (TimerResponse & { remaining_seconds?: number }) | null }> => {
  try {
    const response = await apiTimer.get(`/timers/by-ejecutada/${ejecutada_id}`);
    return response.data as { exists: boolean; timer: (TimerResponse & { remaining_seconds?: number }) | null };
  } catch (error) {
    handleError("getTimerEjecutadaById", error);
    throw error;
  }
};

export const getcontrolTimer = async <T = unknown>(timerId: number): Promise<T[]> => {
  try {
    const { data } = await apiTimer.get(`/getFaseTimer/control/${timerId}`);
    const fases = Array.isArray(data?.maestra_fases_fk?.[0]) ? data.maestra_fases_fk[0] : [];
    return fases as T[];
  } catch (error) {
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Error al obtener el control del timer"
    );
  }
};
