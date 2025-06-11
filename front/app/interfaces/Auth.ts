// export interfaces
export interface AuthResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

export interface UserData {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface Role {
  id: number;
  name: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  [key: string]: unknown;
}