export interface Acondicionamiento {
  number_order: number | string;
  adaptation_id: number | string;
  maestra_id: number | string;
  descripcion_maestra: string;
  linea_produccion: string;
  maestra_tipo_acondicionamiento_fk: number | string;
  maestra_fases_fk: number | string;
  status_dates: string;
  [key: string]: unknown;
}

export interface ListData {
  acondicionamiento?: Acondicionamiento[];
  maestra_tipo_acondicionamiento_fk?: number | string | null;
  maestra_fases_fk?: number | string | null;
  [key: string]: Acondicionamiento[] | number | string | null | undefined;
}

export interface Plan {
  adaptation_id?: number | string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ActividadEjecutada {
  tipo_acon: number;
  stage: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface OrdenActualizada extends Acondicionamiento {
  actividades: ActividadEjecutada[];
}
