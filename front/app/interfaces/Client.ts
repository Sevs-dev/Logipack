export interface Client {
  id: number;
  code: string; // 👈 Esto es lo que te falta
  name: string;
  email: string;
  phone?: string;
  address?: string;
  responsible_person?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // Podés mantenerlo si esperás más props dinámicas
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