export interface Role {
  id: number;
  name: string;
}

export interface Factory {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  signature_bpm: string;
  factory: number[];
}