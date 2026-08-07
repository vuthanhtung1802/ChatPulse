export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status?: string;
}
