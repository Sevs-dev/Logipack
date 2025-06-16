import axios, { AxiosError } from 'axios';
import { API_URL } from '../../config/api';
import { AuthResponse, UserData, LoginData, User, Role, UpdateUserData } from "../../interfaces/Auth"

// Axios Instance
const authUser = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await authUser.post<LoginData>('/login', { email, password });
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const result = handleError(error);
    throw new Error(result.message); // 🔥 lanzamos el mensaje de error
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
  console.log(datosUsuario)
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
export const getDate = async (id: number): Promise<{ date: string; usuario: User }> => {
  const response = await authUser.get(`/date/${id}`);
  return response.data;
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

const handleError = (error: unknown): AuthResponse => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string }>;
    const status = err.response?.status;
    const serverMsg = err.response?.data?.message;
    const defaultMsg = serverMsg || `Ocurrió un error inesperado (${status ?? 'desconocido'})`;

    switch (status) {
      case 400:
        return {
          success: false,
          message: 'Hubo un problema con los datos que enviaste. Por favor, revísalos e intenta de nuevo.',
        };

      case 401:
        return {
          success: false,
          message: 'Uy... parece que el correo o la contraseña no son correctos.',
        };

      case 403:
        return {
          success: false,
          message: 'No tienes acceso a esta opción. Si crees que es un error, contacta con soporte.',
        };

      case 404:
        return {
          success: false,
          message: 'Uy... parece que el correo o la contraseña no son correctos.',
        };

      case 409:
        return {
          success: false,
          message: 'Ya existe algo similar. Intenta con información diferente.',
        };

      case 422:
        return {
          success: false,
          message: 'Parece que falta completar algunos campos. Échale un vistazo antes de continuar.',
        };

      case 429:
        return {
          success: false,
          message: '¡Hey! Estás haciendo muchas solicitudes seguidas. Espera un momento y vuelve a intentar.',
        };

      case 500:
        return {
          success: false,
          message: 'Algo salió mal en nuestro lado. Estamos trabajando para solucionarlo.',
        };

      case 503:
        return {
          success: false,
          message: 'El servicio está en pausa temporalmente. Intenta de nuevo en unos minutos.',
        };

      default:
        return {
          success: false,
          message: 'Ocurrió un error inesperado. Por favor, intenta más tarde.',
        };
    }

  }

  return {
    success: false,
    message: 'Error desconocido. Intenta de nuevo o contacta al soporte si el problema persiste.',
  };
};

