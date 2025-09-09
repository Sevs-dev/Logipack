export interface LocalType {
  id: number;
  linea?: number;
  tipo?: string;
  descripcion?: string;
  orden?: OrdenType;
  plan?:Plans;
}

export interface OrdenType {
  number_order: string;
  descripcion_maestra: string;
  cliente: string;
  planta: string;
  cantidad_producir: number;
  estado: number;
}

export interface LineaItem {
  id: number;
  descripcion: string;
  phase_type: string;
}

export interface LineasResponse {
  orden: OrdenType;
  plan: Plans;
  linea_procesos: LineaItem[];
  linea_fases: LineaItem[];
}

export interface Plans {
  orderNumber?: string;
}
