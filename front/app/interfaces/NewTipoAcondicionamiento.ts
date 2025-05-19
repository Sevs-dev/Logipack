// // interfaces de tipo de acondicionamiento
// export interface StageTipos {
//     id: number; // id del tipo de acondicionamiento
//     descripcion: string; // descripción del tipo de acondicionamiento
//     status: boolean; // estado del tipo de acondicionamiento
// }

// export interface DataTipos {
//     id: number;
//     descripcion: string;   
//     status: boolean;
// }

// // interfaces de tipo de acondicionamiento
// export interface StageOrdenes {
//     id: number; // id del tipo de acondicionamiento
//     orden: number; // posición del tipo de acondicionamiento
//     descripcion: string; // descripción del tipo de acondicionamiento
//     tipo: string; // descripción del tipo de acondicionamiento
//     fase: string; // descripción del tipo de acondicionamiento
//     es_editable: boolean; // si es editable
//     control: boolean; // si repite minutos
//     fase_control: string; // descripción del tipo de acondicionamiento
// }

// export interface DataOrdenes {
//     id: number;
//     orden: number;
//     descripcion: string;
//     tipo: string;
//     fase: string;
//     es_editable: boolean;
//     control: boolean;
//     fase_control: string;
// }


// // interfaces de tipo de acondicionamiento
// export interface StageFaseControl {
//     id: number; // id del tipo de acondicionamiento
//     descripcion: string; // descripción del tipo de acondicionamiento
//     status: boolean; // estado del tipo de acondicionamiento
// }

// export interface DataFaseControl {
//     id: number;
//     descripcion: string;   
//     status: boolean;
// }

// interfaces
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


export interface LineaTipoAcondicionamiento {
    id: number;
    tipo_acondicionamiento_id: number;
    orden: number;
    descripcion: string;
    fase: string;
    editable: boolean;
    control: boolean;
    fase_control: string;
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
};