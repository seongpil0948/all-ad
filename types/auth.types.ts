// Auth related types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export type ForgotPasswordState = {
  errors?: {
    email?: string;
    general?: string;
  };
  success?: boolean;
};

export interface ResetPasswordState {
  errors?: {
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  success?: boolean;
}

export interface ClientLoginResult {
  success: boolean;
  error?: string;
}
