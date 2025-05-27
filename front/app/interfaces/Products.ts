export interface Manu {
    id?: number;
    name: string;
    products: number[];
    factory_id: number;
    factory?: string;
}

export interface Factory {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    name: string;
}
