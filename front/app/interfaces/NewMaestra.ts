export interface Stage {
  id: number;
  description: string;
  status: number;
  duration: number;
  duration_user: number;
}

export interface Data {
  id: number;
  code: number;
  descripcion: string;
  requiere_bom: boolean;
  type_product: string;
  type_acondicionamiento?: number[];
  type_stage: number[];
  status_type: string;
  aprobado: boolean;
  duration: string;
  duration_user: string;
  paralelo: boolean;
}

export interface Maestras {
  descripcion: string;
  requiere_bom: boolean;
  type_product: string;
  type_stage: string;
  status_type: string;
  aprobado: boolean;
  paralelo: boolean;
}

export interface DataService {
  descripcion: string;
  requiere_bom: boolean;
  type_product: string;
  type_acondicionamiento?: number[];
  type_stage: number[];
  status_type: string | null;
  aprobado: boolean;
  paralelo: boolean;
  duration: string;
  duration_user: string;
  user?: string;
}
