// app/services/planing/planingServices.ts
import axios from "axios";
import { API_URL } from "../../config/api";
import { PlanServ } from "@/app/interfaces/EditPlanning";

// Axios base
const Planning = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/* =========================
 *        JSON Types
 * ========================= */
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

// Payloads genéricos donde sí conviene JSON "abierto"
export type GuardarFormularioPayload = JsonObject;
export type GuardarActividadesControlPayload = JsonObject;

/* =========================
 *   Tipos para Conciliación
 *   (fuertemente tipados)
 * ========================= */
export type StrNum = string;

export interface OrdenConc {
  adaptation_date_id: string;
  descripcion_maestra: string;
  number_order: string;
  orden_ejecutada: string;
  orderType: "P" | "H" | string;
  requiere_bom: string;
}

export interface ArticuloConc {
  codart: StrNum;
  desart: StrNum;
  quantityToProduce: StrNum;
  faltante: StrNum;
  adicionales: StrNum;
  rechazo: StrNum;
  danno_proceso: StrNum;
  devolucion: StrNum;
  sobrante: StrNum;
  total: StrNum;
  rendimiento: StrNum;
}

export interface EmpaqueConc {
  unidades_caja: StrNum;
  numero_caja: StrNum;
  unidades_saldo: StrNum;
  total_saldo: StrNum;
}

export interface ConciliacionesConc {
  padre: StrNum;
  hijo: StrNum;
  diferencia: StrNum;
  validate: StrNum;
  list: string[];
}

export interface GetConciliacionResponse {
  orden?: Partial<OrdenConc> | null;
  articulo_principal?: Partial<ArticuloConc> | null;
  articulo_segundario?: Array<Partial<ArticuloConc>> | null;
  conciliaciones?: Partial<ConciliacionesConc> | null;
}

export interface GuardarConciliacionResponse {
  message?: string;
  // añade aquí otras claves que te devuelva tu API si las tienes
}

export type GuardarConciliacionPayload = {
  orden: OrdenConc;
  principal: ArticuloConc;
  secundarios: ArticuloConc[];
  empaque: EmpaqueConc;
};

/* =========================
 *         Services
 * ========================= */
export const getPlanning = async () => {
  try {
    const response = await Planning.get("/getPlan");
    return response.data.plan;
  } catch (error: unknown) {
    console.error("Error en getPlan:", error);
    throw error;
  }
};

export const getConsultPlanning = async () => {
  try {
    const response = await Planning.get("/consult-planning");
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getPlan:", error);
    throw error;
  }
};

export const getPlanDash = async () => {
  try {
    const response = await Planning.get("/getPlanDash");
    return response.data.plan;
  } catch (error: unknown) {
    console.error("Error en getPlan:", error);
    throw error;
  }
};

export const getActivitiesByPlanning = async (id: number) => {
  try {
    const response = await Planning.get(`/getPlanId/${id}`);
    if (response.data && response.data.plan) {
      return response.data.plan;
    }
    console.error("Unexpected response structure:", response.data);
    throw new Error("Unexpected response structure");
  } catch (error: unknown) {
    console.error("Error en getPlanId:", error);
    throw error;
  }
};

export const updatePlanning = async (id: number, updatedPlan: PlanServ) => {
  try {
    const response = await Planning.put(`/updatePlan/${id}`, updatedPlan);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en updatePlan:", error);
    throw error;
  }
};

export const getPlanningById = async (id: number) => {
  try {
    const response = await Planning.get(`/getPlannId/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getPlanId:", error);
    throw error;
  }
};

export const validate_orden = async (id: number) => {
  try {
    const response = await Planning.get(`/validar_estado/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getPlanId:", error);
    throw error;
  }
};

export const linea_procesos = async (id: number) => {
  try {
    const response = await Planning.get(`/linea_procesos/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getPlanId:", error);
    throw error;
  }
};

export const generar_orden = async (id: number) => {
  try {
    const response = await Planning.get(`/generar_orden/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en generar_orden:", error);
    throw error;
  }
};

export const siguiente_fase = async (id: number, linea: number, tipo: string) => {
  try {
    const response = await Planning.get(`/siguiente_fase/${id}/${linea}/${tipo}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en siguiente_fase:", error);
    throw error;
  }
};

export const fase_control = async (id: number) => {
  try {
    const response = await Planning.get(`/getFaseControl/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en fase_control:", error);
    throw error;
  }
};

export const guardar_formulario = async (data: GuardarFormularioPayload) => {
  try {
    const response = await Planning.post(`/guardar_actividades`, data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en guardar_formulario:", error);
    throw error;
  }
};

export const getPlanningByIdPDF = async (id: number) => {
  try {
    const response = await Planning.get(`/getPlanByIdPDF/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getPlanByIdPDF:", error);
    throw error;
  }
};

export const condiciones_fase = async (id: number, fase: number) => {
  try {
    const response = await Planning.get(`/condiciones_fase/${id}/${fase}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en condiciones_fase:", error);
    throw error;
  }
};

export const validate_rol = async (fase: number) => {
  try {
    const response = await Planning.get(`/validate_rol/${fase}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en validate_rol:", error);
    throw error;
  }
};

export const actividades_ejecutadas = async (id: number) => {
  try {
    const response = await Planning.get(`/getActividadesEjecutadas/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en actividades_ejecutadas:", error);
    throw error;
  }
};

export const getConciliacion = async (id: number): Promise<GetConciliacionResponse> => {
  try {
    const response = await Planning.get(`/getConciliacion/${id}`);
    return response.data as GetConciliacionResponse;
  } catch (error: unknown) {
    console.error("Error en getConciliacion:", error);
    throw error;
  }
};

export const guardar_conciliacion = async (
  data: GuardarConciliacionPayload
): Promise<GuardarConciliacionResponse> => {
  try {
    const response = await Planning.post(`/guardar_conciliacion`, data);
    return response.data as GuardarConciliacionResponse;
  } catch (error: unknown) {
    console.error("Error en guardar_conciliacion:", error);
    throw error;
  }
};

export const getRestablecerOrden = async (id: number) => {
  try {
    const response = await Planning.get(`/restablecer_orden/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getRestablecerOrden:", error);
    throw error;
  }
};

export const getActividadesControl = async (id: number) => {
  try {
    const response = await Planning.get(`/getActividadesControl/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getActividadesControl:", error);
    throw error;
  }
};

export const guardar_actividades_control = async (
  data: GuardarActividadesControlPayload
) => {
  try {
    const response = await Planning.post(`/guardar_actividades_control`, data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en guardar_actividades_control:", error);
    throw error;
  }
};

export const getActividadesTestigos = async (id: number) => {
  try {
    const response = await Planning.get(`/getActividadesTestigo/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getActividadesTestigo:", error);
    throw error;
  }
};

export const getRelacionarOrden = async (id: number) => {
  try {
    const response = await Planning.get(`/relacionarOrden/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error en getRelacionarOrden:", error);
    throw error;
  }
};

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

export const sanitizePlan = (plan: Plan): SanitizedPlan => ({
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
});

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
