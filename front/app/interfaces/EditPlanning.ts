 
export interface Plan {
    adaptation_id: number;
    bom: string;
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
    duration?: number;
    duration_breakdown: string;
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