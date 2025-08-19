// User Model Interface
export interface User {
  id: number;
  fullName: string | null;
  email: string;
  createdAt: string;
  updatedAt: string | null;
}

// Login Request Interface
export interface LoginRequest {
  email: string;
  password: string;
}

// Register Request Interface
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

// Login Response Interface
export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Register Response Interface
export interface RegisterResponse {
  message: string;
  data: User;
}

// Me Response Interface
export interface MeResponse {
  message: string;
  data: User;
}

// Logout Response Interface
export interface LogoutResponse {
  message: string;
}

// Generic API Response Interface
export interface ApiResponse<T> {
  message: string;
  data: T;
}
