export interface Orden {
  number_order: string;
  descripcion_maestra: string;
  cliente: string;
  planta: string;
  cantidad_producir: number;
  estado: number;
}

export interface Proceso {
  id: number;
  descripcion: string;
}

export interface ListaResponse {
  orden: Orden | null;
  linea_procesos: Proceso[];
  linea_fases: Proceso[];
}

export interface LocalStorageData {
  id: number;
  linea?: number;
  tipo?: string;
  descripcion?: string;
  orden?: Orden;
}
