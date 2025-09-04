import dayjs from "dayjs";

export interface PlanningItem {
  id: number;
  start_date: string; // "YYYY-MM-DD HH:mm:ss"
  end_date: string; // "YYYY-MM-DD HH:mm:ss"
  duration: string | number; // minutos, a veces con formato m.ss
  color: string; // hex o rgb
  codart: string; // línea
  icon: string; // nombre para DynamicIcon
  number_order: string;
  client_id: number;
}

export interface CalendarEventBase {
  id: number;
  color: string;
  icon: string;
  number_order: string;
  client_id: number;
  clientName?: string;
  codart: string;
}

export interface CalendarEvent extends CalendarEventBase {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  minutes: number;
  title: string;
  lane?: number;
}

export type Filters = {
  numberOrder: string;
  codart: string;
  minDuration: number | null;
  clientName: string;
};

export type OnSelectEvent = (ev: CalendarEvent) => void;
