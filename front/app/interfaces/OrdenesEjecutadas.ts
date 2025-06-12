// Tipos base (ajustalos a tu backend real)
export interface OrdenEjecutada {
  id: number;
  nombre: string;
  estado: string;
  fecha: string;
  // etc...
}

export interface NuevaOrdenPayload {
  adaptation_id: number;
  acciones: string[];
  usuario: string;
  // etc...
}
