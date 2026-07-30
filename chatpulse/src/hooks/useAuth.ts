import { useState } from 'react';
import { User } from '../types/types';

export function useAuthState() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  return { currentUser, setCurrentUser };
}
