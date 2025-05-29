export interface ActivityDetail {
  id: number;
  code: number;
  description: string;
  config: string;
  binding: number;
  value?: string | number | boolean | null;
}

export interface Plan {
  adaptation_id: number;
  bom: string | null;
  client_id: number;
  factory_id: number;
  codart: string;
  created_at: string;
  deliveryDate: string;
  factory: string | null;
  healthRegistration: string;
  id: number;
  ingredients: string;
  line: number[];
  lot: string;
  machine: string | null;
  master: string;
  orderNumber: string;
  quantityToProduce: number;
  resource: string | null;
  status_dates: string;
  client_name?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  end_date?: string;
  duration?: number | string; // Puede venir como string también
  duration_breakdown: string;

  // Nuevas propiedades
  activities?: ActivityDetail[];
  activitiesDetails?: ActivityDetail[]; // si estás usando este nombre aún
  lineActivities?: Record<number, number[]>;
}

export interface Planning {
  id: number;
  number_order: string;
  clock: boolean;
  start_date: string | null;
  end_date: string | null;
  paused: boolean;
  finish_notificade: boolean;
  out: boolean;
}
