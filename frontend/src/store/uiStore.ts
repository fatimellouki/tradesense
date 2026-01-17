import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'fr' | 'ar' | 'en';

interface UIState {
  darkMode: boolean;
  language: Language;
  sidebarOpen: boolean;

  // Actions
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  setLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: true, // Default to dark mode for traders
      language: 'fr',
      sidebarOpen: true,

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (value: boolean) => set({ darkMode: value }),
      setLanguage: (lang: Language) => set({ language: lang }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
