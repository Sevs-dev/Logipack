
export interface TipoAcondicionamiento {
    id: number;
    descripcion: string;
    status: boolean;
};

export interface DataTipoAcondicionamiento {
    id: number;
    descripcion: string;
    status: boolean;
};

export interface Tipo { 
    tipo: string[], 
};


export interface LineaTipoAcondicionamiento {
    id: number;
    tipo_acondicionamiento_id: number;
    orden: number;
    descripcion: string;
    fase: string;
    editable: boolean;
    control: boolean;
    fase_control: string;
    descripcion_fase: string;
    descripcion_fase_control: string;
};

export interface DataLineaTipoAcondicionamiento {
    id: number;
    tipo_acondicionamiento_id: number;
    orden: number;
    descripcion: string;
    fase: string;
    editable: boolean;
    control: boolean;
    fase_control: string;
    descripcion_fase: string;
    descripcion_fase_control: string;
};