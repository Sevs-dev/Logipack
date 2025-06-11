import axios, { AxiosError } from 'axios';
import { API_URL } from '../../config/api';
import { AuthResponse, UserData, LoginResponse, User, Role, UpdateUserData } from "../../interfaces/Auth"

// Axios Instance
const authUser = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await authUser.post<LoginResponse>('/login', { email, password });
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return handleError(error);
  }
};

// Register
export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await authUser.post('/register', { name, email, password });
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return handleError(error);
  }
};

// Get user by email
export const getUserByEmail = async (decodedEmail: string): Promise<User> => {
  try {
    const response = await authUser.get<User>(`/user/${decodedEmail}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en getUserByEmail:', error);
    throw error;
  }
};

// Upload user image
export const uploadUserImage = async (imageFile: File): Promise<AuthResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await authUser.post('/users/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error('Error en uploadUserImage:', error);
    return handleError(error);
  }
};

// Crear usuario (POST general)
export const post = async (datosUsuario: UserData): Promise<User> => {
  try {
    const response = await authUser.post<User>('/users', datosUsuario);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en post:', error);
    throw error;
  }
};

// Get roles
export const getRole = async (): Promise<Role[]> => {
  try {
    const response = await authUser.get<Role[]>(`/role/`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en getRole:', error);
    throw error;
  }
};

// Get all users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await authUser.get<User[]>(`/usersAll/`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en getUsers:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await authUser.delete(`/delete/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en deleteUser:', error);
    throw error;
  }
};

// Get user registration date
export const getDate = async (id: number): Promise<{ date: string }> => {
  try {
    const response = await authUser.get(`/date/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en getDate:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id: number, data: UpdateUserData): Promise<User> => {
  try {
    const response = await authUser.put<User>(`/update/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Error en updateUser:', error);
    throw error;
  }
};

// Manejo de errores reutilizable
const handleError = (error: unknown): AuthResponse => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message: string }>;
    return {
      success: false,
      message: err.response?.data?.message || err.message,
    };
  }
  return { success: false, message: 'Error desconocido' };
};
