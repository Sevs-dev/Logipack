export type ActivityType = {
  type?: string;
  placeholder?: string;
  accept?: string;
  options?: string[];
  min?: number;
  max?: number;
  valor?: number;
  items?: Array<{ min?: number; max?: number; valor?: number }>;
  clase?: string;
  nivel?: string;
  subnivel?: string;
};

export interface NewActivity {
  id: number;
  description: string;
}

export interface Activities {
  id: number;
  code: number;
  description: string;
  config: string;
  binding: boolean;
  has_time: boolean;
  duration: number | undefined;
}

export interface EditFormData {
  id: number;
  description: string;
  config: string;
  binding: boolean;
  has_time: boolean;
  duration: number | undefined;
  options?: string[];
}

export const activityTypes: Record<string, ActivityType> = {
  "Texto corto": { type: "text" },
  "Texto largo": { type: "textarea" },
  "Fecha": { type: "date" }, 
  Adjunto: { type: "file" },
  Foto: { type: "image" },
  "Lista desplegable": { type: "select", options: ["Opción 1", "Opción 2"] },
  "Selección única": { type: "radio", options: [""] },
  "Selección múltiple": { type: "checkbox", options: ["Opción A", "Opción B"] },
  Firma: { type: "signature" },
  Informativo: { type: "text", placeholder: "Escribe aquí..." },
  Rangos: {
    type: "temperature",
    min: undefined,
    max: undefined,
  },
  Muestreo: {
    type: "muestreo",
    items: [
      { min: undefined, max: undefined, valor: undefined },
      // más objetos iguales...
    ],
  },
};

export const initialSelectedType = "Texto corto";

export interface FormData {
  description: string;
  config: string;
  binding: boolean;
  has_time: boolean;
  duration?: number;
}
