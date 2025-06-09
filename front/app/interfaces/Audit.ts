export interface AuditValues {
  [key: string]: any; // o tipalo más finito si podés
}

export interface Audit {
  id: number | string;
  user: string;
  action: string;
  created_at: string;
  old_values?: AuditValues;
  new_values?: AuditValues;
}


export interface AuditModalProps {
  audit: any[];
  onClose: () => void;
}


export interface AuditHistoryProps {
    audit: {
        user: string;
        action: string;
        created_at: string;
        old_values?: AuditValues;
        new_values?: AuditValues;
    } | null;
    onClose: () => void;
}
