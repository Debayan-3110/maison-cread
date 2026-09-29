export interface APIResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  status: 'authenticated' | '2fa_required';
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenRequest {
  refreshToken: string;
}
