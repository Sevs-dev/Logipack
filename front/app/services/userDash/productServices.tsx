import axios from 'axios';
import { API_URL } from '../../config/api';
import { Data } from "../../interfaces/Products"

// Se crea una instancia de axios configurada con la URL base de la API y encabezados predeterminados.
const Product = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Función para crear un nuevo Product.
// Envía una solicitud POST a la ruta '/newProduct' con los datos proporcionados.
export const createProduct = async (data: Data) => {
    try {
        const name = document.cookie
            .split('; ')
            .find(row => row.startsWith('name='))
            ?.split('=')[1];

        if (name) {
            data.user = decodeURIComponent(name);
        }
        const response = await Product.post('/newProduct', data);
        if (!response.data || !response.data.product || !response.data.product.id) {
            throw new Error("Respuesta inválida del servidor");
        }
        return response.data.product; // 🔥 Ahora devuelve el objeto correcto
    } catch (error) {
        throw new Error("No se pudo crear el producto");
    }
};

// Función para obtener todos los Products.
// Realiza una solicitud GET a la ruta '/getProduct' y retorna los datos recibidos.
export const getProduct = async () => {
    try {
        const response = await Product.get(`/getProduct`); 
        return response.data;
    } catch (error) {
        console.error('Error en getProduct:', error);
        throw error;
    }
};

// Función para eliminar un Product en específico por su ID.
// Realiza una solicitud DELETE a la ruta `/deleteProduct/${id}`.
export const deleteProduct = async (id: number) => {
    try {
        const response = await Product.delete(`/deleteProduct/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteProduct:', error);
        throw error;
    }
};

// Función para obtener un Product específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getProductId = async (id: number) => {
    try {
        const response = await Product.get(`/ProductId/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error en getProductId:', error);
        throw error;
    }
};

// Función para obtener un Product específico por su ID.
// Nota: Se utiliza el método PUT en lugar de GET, lo cual es inusual para obtener datos. 
// Es posible que se deba revisar si la ruta o el método es el correcto.
export const getProductName = async (name: string) => {
    try {
        const response = await Product.get(`/ProductName/${name}`);
        return response.data;
    } catch (error) {
        console.error('Error en getProductId:', error);
        throw error;
    }
};

// Función para actualizar un Product existente.
// Envía una solicitud PUT a la ruta `/updateProduct/${id}` con los nuevos datos del Product. 
export const updateProduct = async (id: number, data: Data) => {
    try {
        const response = await Product.put(`/updateProduct/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error en updateProduct:', error);
        throw error;
    }
};
