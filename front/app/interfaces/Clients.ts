// Interfaz de cliente
export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    created_at: string;
    updated_at: string;
    responsible_person: string[]; // O una estructura más compleja si aplica
}

// DTO para crear/editar cliente
export interface ClientPayload {
    name: string;
    email: string;
    phone: string;
    address: string;
    responsible_person?: string[];
}