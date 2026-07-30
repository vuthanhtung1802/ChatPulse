export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  plan: string;
  status: 'online' | 'offline';
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string;
  interests?: string[];
  photoGallery?: string[];
}
