export interface Stage {
    id: number;
    code: number;
    description: string;
    phase_type: "Planeacion" | "Conciliación" | "Control" | "Actividades";
    repeat: boolean;
    repeat_minutes?: number;
    alert: boolean;
    can_pause: boolean;
    status: boolean;
    activities: string;
}

export interface Data {
    description: string;
    phase_type: "Planeacion" | "Conciliación" | "Control" | "Actividades";
    repeat: boolean;
    repeat_minutes?: number;
    alert: boolean;
    can_pause: boolean;
    status: boolean;
    activities: string;
    duration: string;
    duration_user: string;
}