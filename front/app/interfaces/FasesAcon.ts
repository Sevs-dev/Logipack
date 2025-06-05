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

export interface FasesProps {
  proms: Lista[];
  setMemoria: React.Dispatch<React.SetStateAction<any[]>>;
  memoria: any[];
  estado_form: boolean;
  setEstado_form: React.Dispatch<React.SetStateAction<boolean>>;
  finalizado_form: boolean;
  setFinalizado_form: React.Dispatch<React.SetStateAction<boolean>>;
}
