import axios from 'axios';
import {API_URL} from '../../config/api' 

// Se crea una instancia de axios con la configuración base de la API.
const authUser = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Servicio para iniciar sesión
export const login = async (email: string, password: string) => {
  try {
    const response = await authUser.post('/login', {
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

// Servicio para registrar un nuevo usuario
export const register = async (name: string, email: string, password: string) => {
  try {
    const response = await authUser.post('/register', {
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

// Servicio para obtener un usuario por su correo electrónico
export const getUserByEmail = async (decodedEmail: string) => {
  try {
    const response = await authUser.get(`/user/${decodedEmail}`);
    return response.data;
  } catch (error) {
    console.error('Error en getUserByEmail:', error);
    throw error;
  }
};

// Servicio para subir una imagen (usada en crear y editar usuarios)
export const uploadUserImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await authUser.post('/users/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error en uploadUserImage:', error);
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

export const post = async (datosUsuario: any) => { 
  console.log('Antes de enviar:', datosUsuario);
  try {
    const response = await authUser.post('/users',datosUsuario);

    return response.data;
  } catch (error) {
    console.error('Error en post:', error);
    throw error;
  }
};

// Servicio para obtener los roles de usuario
export const getRole = async () => {
  try {
    const response = await authUser.get(`/role/`);
    return response.data;
  } catch (error) {
    console.error('Error en getRole:', error);
    throw error;
  }
};

// Servicio para obtener la lista de todos los usuarios
export const getUsers = async () => {
  try {
    const response = await authUser.get(`/usersAll/`);
    return response.data;
  } catch (error) {
    console.error('Error en getUsers:', error);
    throw error;
  }
};

// Servicio para eliminar un usuario por su ID
export const deleteUser = async (id: number) => { 
  try {
    const response = await authUser.delete(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error en deleteUser:', error);
    throw error;
  }
}

// Servicio para obtener la fecha de registro de un usuario por su ID
export const getDate = async (id: number) => {
  try {
    const response = await authUser.get(`/date/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error en getDate:', error);
    throw error;
  }
}

// Servicio para actualizar la información de un usuario por su ID
export const updateUser = async (id: number, data: any) => {
  try {
    const response = await authUser.put(`/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error en updateUser:', error);
    throw error;
  }
}

