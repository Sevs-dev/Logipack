export interface TimerControlItem {
  activity_id: number;
  tipo: string;
  descripcion: string;
  valor: string;
  clave?: string;
}

// Payload de request para crear/guardar datos de control
export interface TimerControlData {
  timer_id: number;
  user: string;
  data: TimerControlItem[];
}

// Respuesta de la API al leer datos guardados
export interface TimerControlResponse {
  id: number;
  timer_id: number;
  user: string;
  data: TimerControlItem[];
  created_at: string;
  updated_at: string;
}
