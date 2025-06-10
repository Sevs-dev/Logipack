export interface Factory {
    id: number;
    name: string;
    location: string;
    capacity: string;
    manager: string;
    employees: number;
    status: boolean;
    prefix: string;
}

export interface FactoryData {
    name: string;
    location: string;
    capacity: string;
    manager: string;
    employees: string;
    status: boolean;
    prefix: string;
    user?: string;
}

export interface FactoryResponse extends FactoryData {
    id: number;
    createdAt: string;
    updatedAt: string;
}