export interface Stage {
  id: number;
  description: string;
  phase_type: string;
  repeat: boolean;
  repeat_line: boolean;
  repeat_minutes?: number;
  alert: boolean;
  can_pause: boolean;
  status: boolean;
  multi: boolean;
  activities: string;
  duration: string;
  duration_user: string;
  role: string;
  version:string;
  
}

export interface Data {
  description: string;
  phase_type: string;
  repeat: boolean;
  repeat_line: boolean;
  repeat_minutes?: number;
  alert: boolean;
  can_pause: boolean;
  status: boolean;
  multi: boolean;
  activities?: number[];
  duration: string;
  duration_user: string;
  user?: string;
  role?: string;
}

export interface StageResponse {
  status: number;
  message?: string;
}

export interface ErrorResponse {
  message?: string;
}

export interface StageFase {
  id: number;
  description: string;
  duration: string;
  duration_user: string;
  phase_type: string;
}
