export interface Data {
  id: number;
  clientId: number;
  orderNumber: string;
  deliveryDate: string;
  articleCode: string;
  lot: string;
  healthRegistration: string;
  quantityToProduce: number;
  attachment?: string;
  master?: string;
  bom?: string;
}

export interface BOM {
  id: number;
  client_id: number;
  base_quantity: string;
  details: string;
  status: number;
  ingredients: string;
  code_ingredients: string;
  code_details: string;
}

export interface BOMResponse {
  boms: BOM[];
}

export interface Adaptation {
  id: number;
  client_id: number;
  order_number: string;
  delivery_date: string;
  article_code: string;
  client_name?: string;
  numberOrder?: string;
  number_order?: string;
}

export interface ArticleFormData {
  orderNumber: string;
  deliveryDate: string;
  quantityToProduce: number;
  lot: string;
  healthRegistration: string;
  attachment?: File | null;
  duration?: string;
  start_date?: string;
  end_date?: string;
  numberOrder?: string;
}

export interface ArticleFieldsMap {
  [codart: string]: ArticleFormData;
}

export interface Articles {
  codart: string;
  orderNumber: string;
  deliveryDate: string;
  quantityToProduce: number;
  lot: string;
  healthRegistration: string;
  attachment?: File;
  numberOrder?: string;
}

export interface Plant {
  id: number;
  name: string;
  prefix: string;
}
