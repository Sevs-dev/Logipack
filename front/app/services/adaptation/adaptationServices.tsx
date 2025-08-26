// services/adaptation/adaptationServices.ts
import axios from "axios";
import { API_URL } from "../../config/api";

// Instancia de axios configurada para Adaptations
const Adaptations = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Crea una nueva adaptación con datos tipo FormData
export const newAdaptation = async (data: FormData) => {
  try {
    const name = document.cookie
      .split("; ")
      .find((row) => row.startsWith("name="))
      ?.split("=")[1];

    if (name) {
      data.append("user", decodeURIComponent(name));
    }

    const response = await Adaptations.post("/newAdaptation", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error("Error en newAdaptation:", error);
    throw error;
  }
};

// Obtiene todas las adaptaciones
export const getAdaptations = async () => {
  try {
    const response = await Adaptations.get("/getAdaptation");
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getAdaptations:", error);
    throw error;
  }
};

// Obtiene una adaptación por ID
export const getAdaptationsId = async (id: number) => {
  try {
    const response = await Adaptations.get(`/getAdaptationId/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getAdaptationsId:", error);
    throw error;
  }
};

// Actualiza una adaptación (usa FormData con método POST y _method=PUT)
export const updateAdaptation = async (id: number, data: FormData) => {
  try {
    data.append("_method", "PUT");
    const response = await Adaptations.post(`/updateAdaptation/${id}`, data, {
      transformRequest: (d) => d, // ✅ no serializar
      headers: {}, // ✅ NO pongas 'multipart/form-data' a mano
    }); 
    return response.data;
  } catch (error) {
    console.error("Error en updateAdaptation:", error);
    throw error;
  }
};

// Elimina una adaptación por ID
export const deleteAdaptation = async (id: number) => {
  try {
    const response = await Adaptations.delete(`/deleteAdaptation/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en deleteAdaptation:", error);
    throw error;
  }
};
