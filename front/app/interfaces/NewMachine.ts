 
export interface MachineryForm {
  factory_id: number;
  name: string;
  category: string;
  type?: string;
  power?: number;
  capacity?: number;
  dimensions?: string;
  weight?: number;
  is_mobile: boolean;
  description?: string;
}

export interface Machine {
  id: number;
  name: string;
  status: boolean;
}
  