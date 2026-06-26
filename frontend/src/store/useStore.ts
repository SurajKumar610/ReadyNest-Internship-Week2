import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  role: string;
  is_verified: boolean;
}

interface AppState {
  token: string | null;
  user: User | null;
  activeWorkspaceId: number | null;
  activeProjectId: number | null;
  theme: 'light' | 'dark';
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setActiveWorkspaceId: (id: number | null) => void;
  setActiveProjectId: (id: number | null) => void;
  toggleTheme: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  activeWorkspaceId: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('activeWorkspaceId') || 'null') : null,
  activeProjectId: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('activeProjectId') || 'null') : null,
  theme: typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' || 'dark') : 'dark',

  setToken: (token) => set(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    return { token };
  }),

  setUser: (user) => set(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    return { user };
  }),

  setActiveWorkspaceId: (id) => set(() => {
    if (id !== null) {
      localStorage.setItem('activeWorkspaceId', JSON.stringify(id));
    } else {
      localStorage.removeItem('activeWorkspaceId');
    }
    return { activeWorkspaceId: id };
  }),

  setActiveProjectId: (id) => set(() => {
    if (id !== null) {
      localStorage.setItem('activeProjectId', JSON.stringify(id));
    } else {
      localStorage.removeItem('activeProjectId');
    }
    return { activeProjectId: id };
  }),

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', nextTheme);
    return { theme: nextTheme };
  }),

  logout: () => set(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeWorkspaceId');
    localStorage.removeItem('activeProjectId');
    return {
      token: null,
      user: null,
      activeWorkspaceId: null,
      activeProjectId: null
    };
  })
}));
