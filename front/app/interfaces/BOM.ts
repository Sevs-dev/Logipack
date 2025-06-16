export interface ClientBom {
  id: string;
  code: string;
  name: string;
}

export interface Article {
  bom?: (Bom & { ingredients?: string }) | null;
  data: never[];
  codart: string;
  desart: string;
  coddiv: string;
  numberOrder?: string;
}

export interface Ingredient {
  codart: string;
  desart: string;
  quantity: string;
  merma: string;
  theoreticalQuantity?: string; // New field
  teorica: string;
  validar?: string;
}

export interface Bom {
  id: number;
  client_name: string;
  article_codart: string;
  article_desart: string;
  client_id: number;
  base_quantity: string;
  details: string;
  status: boolean;
}

export interface BomView extends Bom {
  client_name: string;
  article_codart: string;
  article_desart: string;
}

export interface BomPayload {
  client_id: number;
  base_quantity: string;
  details: string;
  code_details: string;
  ingredients: string;
  code_ingredients: string;
  status: boolean;
  user?: string;
}

export interface Bom extends BomPayload {
  id: number;
}
