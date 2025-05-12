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
  type_stage: string;
  status_type: string;
  aprobado: boolean;
  duration: string;
  duration_user: string;
}

export interface Maestras {
  descripcion: string;
  requiere_bom: boolean;
  type_product: string;
  type_stage: string;
  status_type: string;
  aprobado: boolean;
}
