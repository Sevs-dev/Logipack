 
export interface MachineryForm {
  factory_id: number;
  name: string;
  category: string;
  type?: string;
  power?: string;
  capacity?: string;
  dimensions?: string;
  weight?: string;
  is_mobile: boolean;
  description?: string;
}

export interface Machine {
  id: number;
  name: string;
  status: boolean;
}
  