
export interface TimerControlData {
    timer_id: number;
    user: string;
    data: any[];  
}

export interface TimerControlResponse {
    id: number;
    timer_id: number;
    user: string;
    data: any[];
    created_at: string;
    updated_at: string;
}