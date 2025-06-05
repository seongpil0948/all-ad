// Server Actions 관련 타입 정의

export type ActionState = {
  errors?: {
    email?: string;
    password?: string;
    general?: string;
  };
  success?: boolean;
};
