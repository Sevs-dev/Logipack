export type ActivityType = {
    type?: string;
    placeholder?: string;
    accept?: string;
    options?: string[];
};

export interface Activities {
    id: number;
    code: number;
    description: string;
    config: string;
    binding: boolean;
    has_time: boolean;
    duration: number;
} 

export interface EditFormData {
    id: number;
    description: string;
    config: string;
    binding: boolean;
    has_time: boolean;
    duration: number;
    options?: string[];
}

export const activityTypes: Record<string, ActivityType> = {
    "Texto corto": { type: "text" },
    "Texto largo": { type: "textarea" },
    Adjunto: { type: "file" },
    Foto: { type: "image" },
    "Lista desplegable": { type: "select", options: ["Opción 1", "Opción 2"] },
    "Selección única": { type: "radio", options: ["Sí"] },
    "Selección múltiple": { type: "checkbox", options: ["Opción A", "Opción B"] },
    Firma: { type: "signature" },
    Informativo: { type: "text", placeholder: "Escribe aquí..." },
};

export const initialSelectedType = "Texto corto";