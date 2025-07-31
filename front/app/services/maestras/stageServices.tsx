import axios, { AxiosError } from "axios";
import { API_URL } from "../../config/api";
import { Data, StageResponse, ErrorResponse, Stage } from "../../interfaces/NewStage"; 
const StageServ = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getUserFromCookie = (): string | undefined => {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("name="))
    ?.split("=")[1];
};

export const createStage = async (data: Data): Promise<StageResponse> => {
  try {
    const name = getUserFromCookie();
    if (name) {
      data.user = decodeURIComponent(name);
    }
    const response = await StageServ.post("/newFase", data);
    return {
      status: response.status,
      message: response.data?.message,
    };
  } catch (error: unknown) {
    handleAxiosError("createStage", error);
    throw error;
  }
};

export const getStage = async (): Promise<Stage[]> => {
  try {
    const response = await StageServ.get("/getFase");
    return response.data;
  } catch (error: unknown) {
    handleAxiosError("getStage", error);
    throw error;
  }
};

export const deleteStage = async (id: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await StageServ.delete(`/deleteFase/${id}`);
    return response.data;
  } catch (error: unknown) {
    handleAxiosError("deleteStage", error);
    throw error;
  }
};

export const getStageId = async (id: number): Promise<Stage> => {
  try {
    const response = await StageServ.get(`/FaseId/${id}`);
    return response.data;
  } catch (error: unknown) {
    handleAxiosError("getStageId", error);
    throw error;
  }
};

export const getStageName = async (name: string): Promise<Data[]> => {
  try {
    const response = await StageServ.get(`/FaseName/${name}`);
    return response.data;
  } catch (error: unknown) {
    handleAxiosError("getStageName", error);
    throw error;
  }
};

export const updateStage = async (id: number, data: Data): Promise<StageResponse> => {
  try {
    const response = await StageServ.put(`/updateFase/${id}`, data);
    return {
      status: response.status,
      message: response.data?.message,
    };
  } catch (error: unknown) {
    handleAxiosError("updateStage", error);
    throw error;
  }
};

const handleAxiosError = (fn: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ErrorResponse>;
    console.error(`Error en ${fn}:`, err.response?.data?.message || err.message);
  } else {
    console.error(`Error inesperado en ${fn}:`, error);
  }
};

export const controlStage = async (id: number): Promise<Stage> => {
  try {
    const response = await StageServ.get(`/controlStages/${id}`);
    return response.data;
  } catch (error: unknown) {
    handleAxiosError("controlStage", error);
    throw error;
  }
} 