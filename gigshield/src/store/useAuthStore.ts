import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthState {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email: string) => set({
        user: {
          id: 'user_123',
          name: email.split('@')[0],
          email,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`
        }
      }),
      logout: () => set({ user: null })
    }),
    { name: 'auth-storage' }
  )
)
