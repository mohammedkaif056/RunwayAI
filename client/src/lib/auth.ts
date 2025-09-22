import { User } from "@shared/schema";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}
