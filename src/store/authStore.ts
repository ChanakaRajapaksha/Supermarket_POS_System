import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john@supermarket.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
  },
  isAuthenticated: true,
  theme: 'light',
  
  login: async (email: string, password: string) => {
    // Simulate login
    if (email === 'admin@pos.com' && password === 'admin123') {
      set({
        user: {
          id: '1',
          name: 'Admin User',
          email: 'admin@pos.com',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
        },
        isAuthenticated: true,
      });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  },
}));