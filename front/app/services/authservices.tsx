import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Servicio para Login
export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/login', {
      email,
      password,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || error.response.statusText,
      };
    } else {
      return { success: false, message: error.message };
    }
  }
};

// Servicio para Registro
export const register = async (name: string, email: string, password: string) => {
  try {
    const response = await apiClient.post('/register', {
      name,
      email,
      password,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || error.response.statusText,
      };
    } else {
      return { success: false, message: error.message };
    }
  }
};
