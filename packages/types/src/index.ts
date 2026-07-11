export interface HealthResponse {
  status: "ok";
  dbConnected: boolean;
  timestamp: string;
}

export type UserRole = "admin" | "teacher" | "student";

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  displayName: string;
  mustChangePassword: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface LoginResponse extends AuthTokens {
  user: UserProfile;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: Extract<UserRole, "teacher" | "student">;
}

export interface CreateClassRequest {
  name: string;
}

export interface ClassSummary {
  id: number;
  name: string;
  teacherId: number;
}

export interface RegisterStudentRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface ApiErrorResponse {
  error: string;
}
