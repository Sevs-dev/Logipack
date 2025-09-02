export type Planning = {
  id: number | string;
  number_order?: string;
  client?: { name: string };
  client_id?: string | number;
  status_dates?: string;
  created_at?: string;
  end_date?: string;
};

export type KPIItem = {
  label: string;
  color: string; // Tailwind class
  icon: string;  // emoji/text
  value: number;
};
