export interface ActividadConfig {
  type: string;
  options?: string[];
}

export interface Actividad {
  id_activitie: string;
  descripcion_activitie: string;
  config: ActividadConfig | string;
  binding?: boolean;
}

export interface Lista {
  tipo_acondicionamiento_id: string | number;
  fases_fk: string | number;
  descripcion_fase: string;
  actividades: Actividad[][];
}

export interface MemoriaItem {
  id_activitie: string;
  value: string | number | boolean | null;
  tipo_acondicionamiento_id?: string | number;
  fases_fk?: string | number;
}

export interface TipoAcomProps {
  proms: Lista[];
  setMemoria: React.Dispatch<React.SetStateAction<MemoriaItem[]>>;
  memoria: MemoriaItem[];
  estado_form: boolean;
  setEstado_form: React.Dispatch<React.SetStateAction<boolean>>;
}
