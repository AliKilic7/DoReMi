/** Shared domain types mirrored from the API's public payloads. */

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
}

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}
