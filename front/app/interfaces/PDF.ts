export interface Stage {
  id: number | string;
  description: string;
}

export interface TimerControlDataItem {
  descripcion: string;
  valor: string | number | Record<string, unknown>;
  clave: string;
  tipo: string;
}

export interface TimerControl {
  id: number;
  user: string;
  data: TimerControlDataItem[];
  created_at: string;
}

export interface Timer {
  id: number;
  orden_id: string;
  timer_controls: TimerControl[];
}

export interface DataType {
  plan: {
    number_order: string;
    codart: string;
    product_name?: string;
    lot: string;
    expiration?: string;
    quantityToProduce: number;
    bom?: number;
    end_date?: string;
    user: string;
    updated_at?: string;
  };
  cliente: {
    name: string;
  };
  stages: Stage[];
  desart?: string;
  actividadesEjecutadas: {
    id: number;
    description_fase: string;
    forms?: {
      descripcion_activitie?: string;
      valor?: string;
      linea?: string;
    }[];
    user?: string;
    created_at?: string;
  }[];
  timers: Timer[];
}
