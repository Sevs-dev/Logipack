import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Se crea una instancia de axios con la configuración base de la API.
const ingredientService = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Obtener la lista de ingredientes
export const getIngredients = async () => {
  try {
    const response = await ingredientService.get("/ingredients/list");
    return response.data;
  } catch (error) {
    console.error("Error en getIngredients:", error);
    throw error;
  }
};

// 🔹 Obtener un ingrediente por ID
export const getIngredientById = async (id) => {
  try {
    const response = await ingredientService.get(`/ingredients/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error en getIngredientById:", error);
    throw error;
  }
};

// 🔹 Crear un nuevo ingrediente
export const createIngredient = async (data) => {
  try {
    const response = await ingredientService.post("/ingredients/create", data);
    return response.data;
  } catch (error) {
    console.error("Error en createIngredient:", error);
    throw error;
  }
};

// 🔹 Actualizar un ingrediente
export const updateIngredient = async (id, data) => {
  try {
    const response = await ingredientService.put(`/ingredients/${id}/update`, data);
    return response.data;
  } catch (error) {
    console.error("Error en updateIngredient:", error);
    throw error;
  }
};

// 🔹 Desactivar un ingrediente
export const deactivateIngredient = async (id) => {
  try {
    const response = await ingredientService.put(`/ingredients/${id}/deactivate`);
    return response.data;
  } catch (error) {
    console.error("Error en deactivateIngredient:", error);
    throw error;
  }
};