export interface Client {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    responsible_person?: string[]; // O el tipo que corresponda
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown; // Para extender si hay props dinámicas
}

export interface ClientInput {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    responsible_person?: string[];
}

export interface ApiError {
    message: string;
}