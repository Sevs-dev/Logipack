// Define una estructura más segura para los valores de auditoría
export interface AuditValues {
  [key: string]: string | number | boolean | null | undefined; // o Record<string, unknown> si querés full flexibilidad
}

// Tipo principal de auditoría
export interface Audit {
  id: number | string;
  user: string;
  action: string;
  created_at: string;
  old_values?: AuditValues;
  new_values?: AuditValues;
}

// Props del modal de auditoría
export interface AuditModalProps {
  audit: Audit[]; // antes: any[]
  onClose: () => void;
}

// Props del historial de auditoría (detalle único)
export interface AuditHistoryProps {
  audit: Audit | null; // antes era un objeto parcial, pero podés usar Audit completo
  onClose: () => void;
}
