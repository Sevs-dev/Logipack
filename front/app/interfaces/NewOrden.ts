export interface Acondicionamiento { 
  number_order: number | string;
  adaptation_id: number | string;
  maestra_id: number | string;
  descripcion_maestra: string;
  linea_produccion: string;
  maestra_tipo_acondicionamiento_fk: number | string;
  maestra_fases_fk: number | string;
  status_dates: string;
  [key: string]: any;
}

export interface ListData {
  acondicionamiento?: Acondicionamiento[];
  maestra_tipo_acondicionamiento_fk?: any;
  maestra_fases_fk?: any;
  [key: string]: any;
}

export interface Plan {
  adaptation_id?: number | string;
  [key: string]: any;
}

export interface ActividadEjecutada {
  tipo_acon: number;
  stage: number;
  [key: string]: any;
}

export interface OrdenActualizada extends Acondicionamiento {
  actividades: ActividadEjecutada[];
}