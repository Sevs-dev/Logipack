export interface ConfigType {
  type: string;
  options?: string[];
}

export interface Actividad {
  id_activitie: string;
  descripcion_activitie: string;
  binding: boolean;
  config: ConfigType | string;
}

export interface Lista {
  tipo_acondicionamiento_id: string;
  fases_fk: string;
  descripcion_fase: string;
  actividades: Actividad[][];
}

// Tipo definido para los valores de memoria (puede ajustarse si se requiere más detalle)
export interface MemoriaItem {
  actividad_id: string;
  value: string | number | boolean | null | Array<string | number | boolean>;
  binding?: boolean;
  config?: ConfigType | string;
}

export interface FasesProps {
  proms: Lista[];
  setMemoria: React.Dispatch<React.SetStateAction<MemoriaItem[]>>;
  memoria: MemoriaItem[];
  estado_form: boolean;
  setEstado_form: React.Dispatch<React.SetStateAction<boolean>>;
  finalizado_form: boolean;
  setFinalizado_form: React.Dispatch<React.SetStateAction<boolean>>;
}
