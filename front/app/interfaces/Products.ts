export interface Manu {
  id?: number;
  name: string;
  products: number[];
  factory_id: number;
  factory?: string;
  user?: string;
}

export interface ManuServ {
  id: number;
  name: string;
  products: number[];
  factory_id: number;
  factory?: string;
  user?: string;
}

export interface Factory {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  modelId: number;
  changes: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
}

export interface Data {
  name: string;
  user?: string;
  canEdit?: boolean;
  canView?: boolean;
}
