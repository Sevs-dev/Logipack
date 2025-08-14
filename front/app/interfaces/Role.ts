export interface Role {
  id: number;
  name: string;
  canEdit?: boolean; // permisos del usuario logueado para usar esta vista
  canView?: boolean;
}
