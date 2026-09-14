export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResult extends AuthTokens {
  user: LoginUser;
}
