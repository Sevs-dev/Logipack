export interface ActivityDetail {
  id: number;
  code: number;
  description: string;
  config: string;
  binding: number | number[] | null;
  value?: string | number | boolean | null;
  activities?: LineActivityGroup[];
}

export interface LineActivityGroup {
  id: number; // id de la línea
  activities: { id: number }[];
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
  machine: number[];
  users: number[];
  master: string;
  orderNumber: string;
  orderType: string;
  number_order: string;
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
 
  order: string; 
  lines: string[]; 
  machines: string[]; 
  status: string;  
}

export interface PlanServ {
  id: number;
  adaptation_id: number;
  bom: string | null;
  master: string | null; // ← ✔ ahora acepta null
  client_id: number;
  factory_id: number;
  codart: string;
  created_at: string;
  deliveryDate: string;
  factory: string | null;
  healthRegistration: string;
  ingredients: string;
  line: number[];
  lot: string;
  machine: number[];
  users: number[];
  orderNumber: string;
  orderType: string;
  number_order: string;
  quantityToProduce: number;
  resource: string | null;
  status_dates: string;
  client_name?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  end_date?: string;
  duration?: number | string;
  duration_breakdown: string;
  activities?: { id: number; activities: { id: number }[] }[];
  activitiesDetails?: ActivityDetail[];
  lineActivities?: Record<number, number[]>;
  planning_user?: string | null;
  user?: string | null;
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

export interface NewActivity {
  id: number;
  description: string;
  value?: string | number | boolean | null;
  code?: number;
  config?: string;
  binding?: number | number[] | null;
}

export interface SanitizedPlan {
  id: number;
  client_id: number;
  factory_id: number;
  master: string;
  bom: string | null;
  codart: string;
  deliveryDate: string;
  healthRegistration: string;
  ingredients: string;
  line: number[];
  lot: string;
  machine: number[];
  quantityToProduce: number;
  resource: string | null;
  start_date?: string;
  end_date?: string;
  duration: number;
  duration_breakdown: string;
  status_dates: string;
  created_at: string;
}

export const sanitizePlan = (plan: Plan): SanitizedPlan => {
  return {
    id: plan.id,
    client_id: plan.client_id,
    factory_id: plan.factory_id,
    master: plan.master,
    bom: plan.bom,
    codart: plan.codart,
    deliveryDate: plan.deliveryDate,
    healthRegistration: plan.healthRegistration,
    ingredients: plan.ingredients,
    line: plan.line,
    lot: plan.lot,
    machine: plan.machine,
    quantityToProduce: plan.quantityToProduce,
    resource: plan.resource,
    start_date: plan.start_date,
    end_date: plan.end_date,
    duration: Number(plan.duration || 0),
    duration_breakdown: plan.duration_breakdown,
    status_dates: plan.status_dates,
    created_at: plan.created_at,
  };
};

export interface ServerPlan extends Plan {
  ID_ADAPTACION: number;
  ID_LINEA?: number;
  ID_LINE?: number;
  ID_ACTIVITIES?: number[];
}

export interface DurationItem {
  fase: string;
  teorica_total?: number;
  multiplicacion?: string;
  resultado: number;
}


///////
export interface RelatedEntity {
  id: number;
  name: string;
}

export interface ActivityDetailFetch {
  id: number;
  name: string;
}

export interface PlanFetch {
  adaptation_id: number;
  bom: string | null;
  client_id: number;
  factory_id: number;
  codart: string;
  created_at: string;
  deliveryDate: string;
 factory: { id: number; name: string } // 👈 eso es un objeto, no un string
  healthRegistration: string;
  id: number;
  ingredients: string;
  line: number[];
  lot: string;
  machine: number[];
  users: number[];
  master: string;
  orderNumber: string;
  number_order: string;
  quantityToProduce: number;
  resource: string | null;
  status_dates: string;
  duration_breakdown: string;

  // Opcionales
  activities?: ActivityDetail[];
  activitiesDetails?: ActivityDetail[];
  lineActivities?: Record<number, number[]>;
}

export interface EnrichedPlan extends Omit<PlanFetch, 'factory' | 'users' | 'machine' | 'line'> {
  client: RelatedEntity | null;
  adaptation: RelatedEntity | null;
  maestra: RelatedEntity | null;
  factory: RelatedEntity | null;
  machines: RelatedEntity[];
  users: RelatedEntity[];
  lines: RelatedEntity[];
}

export interface LineActivity {
  id: number;
  activities: { id: number }[];
}

export interface PlanningItem {
  id: number;
  client_id: number;
  client_name: string;
  order: string;
  codart: string; 
  factory: string;
  lines: string[];     // Nombres de líneas
  machines: string[];  // Nombres de máquinas
  users: string[];     // Nombres de usuarios
  start_date: string;  // Formato ISO: "2025-07-30 13:11:00"
  status: string;
  created_at: string;  // ISO: "2025-07-29T20:48:39.000000Z"
}

/* =========================
 *     Tipos extra (planes)
 * ========================= */
export interface ActivityDetail {
  id: number;
  code: number;
  description: string;
  config: string;
  binding: number | number[] | null;
  value?: string | number | boolean | null;
  activities?: LineActivityGroup[];
}

export interface LineActivityGroup {
  id: number; // id de la línea
  activities: { id: number }[];
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
  machine: number[];
  users: number[];
  master: string;
  orderNumber: string;
  orderType: string;
  number_order: string;
  quantityToProduce: number;
  resource: string | null;
  status_dates: string;
  client_name?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  end_date?: string;
  duration?: number | string;
  duration_breakdown: string;

  activities?: ActivityDetail[];
  activitiesDetails?: ActivityDetail[];
  lineActivities?: Record<number, number[]>;

  order: string;
  lines: string[];
  machines: string[];
  status: string;
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

export interface NewActivity {
  id: number;
  description: string;
  value?: string | number | boolean | null;
  code?: number;
  config?: string;
  binding?: number | number[] | null;
}

export interface SanitizedPlan {
  id: number;
  client_id: number;
  factory_id: number;
  master: string;
  bom: string | null;
  codart: string;
  deliveryDate: string;
  healthRegistration: string;
  ingredients: string;
  line: number[];
  lot: string;
  machine: number[];
  quantityToProduce: number;
  resource: string | null;
  start_date?: string;
  end_date?: string;
  duration: number;
  duration_breakdown: string;
  status_dates: string;
  created_at: string;
}




///EXPORT ALBERTO

export interface ServerPlan extends Plan {
  ID_ADAPTACION: number;
  ID_LINEA?: number;
  ID_LINE?: number;
  ID_ACTIVITIES?: number[];
}

export interface DurationItem {
  fase: string;
  teorica_total?: number;
  multiplicacion?: string;
  resultado: number;
}

export interface RelatedEntity {
  id: number;
  name: string;
}

export interface ActivityDetailFetch {
  id: number;
  name: string;
}

export interface PlanFetch {
  adaptation_id: number;
  bom: string | null;
  client_id: number;
  factory_id: number;
  codart: string;
  created_at: string;
  deliveryDate: string;
  factory: { id: number; name: string }; // 👈 objeto (corregido con ;)
  healthRegistration: string;
  id: number;
  ingredients: string;
  line: number[];
  lot: string;
  machine: number[];
  users: number[];
  master: string;
  orderNumber: string;
  number_order: string;
  quantityToProduce: number;
  resource: string | null;
  status_dates: string;
  duration_breakdown: string;

  activities?: ActivityDetail[];
  activitiesDetails?: ActivityDetail[];
  lineActivities?: Record<number, number[]>;
}

export interface EnrichedPlan
  extends Omit<PlanFetch, "factory" | "users" | "machine" | "line"> {
  client: RelatedEntity | null;
  adaptation: RelatedEntity | null;
  maestra: RelatedEntity | null;
  factory: RelatedEntity | null;
  machines: RelatedEntity[];
  users: RelatedEntity[];
  lines: RelatedEntity[];
}

export interface LineActivity {
  id: number;
  activities: { id: number }[];
}

export interface PlanningItem {
  id: number;
  client_id: number;
  client_name: string;
  order: string;
  codart: string;
  factory: string;
  lines: string[];
  machines: string[];
  users: string[];
  start_date: string;  // "YYYY-MM-DD HH:mm:ss"
  status: string;
  created_at: string;  // ISO
}
